#!/bin/bash

# Local CI Verification Script
# Runs all CI checks locally in the same order as GitHub Actions
# Usage: ./scripts/local-ci.sh [--verbose] [--skip-build] [--skip-e2e]

set -e  # Exit on any error

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERBOSE=false
SKIP_BUILD=false
SKIP_E2E=false
START_TIME=$(date +%s)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-e2e)
      SKIP_E2E=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--verbose] [--skip-build] [--skip-e2e]"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}=====================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=====================================${NC}\n"
}

# Utility functions
run_command() {
  local cmd="$1"
  local description="$2"
  
  if [ "$VERBOSE" = true ]; then
    log_info "Running: $cmd"
  fi
  
  if eval "$cmd"; then
    log_success "$description completed successfully"
    return 0
  else
    log_error "$description failed"
    return 1
  fi
}

check_dependencies() {
  log_step "Checking Dependencies"
  
  # Check if we're in the right directory
  if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
  fi
  
  # Check Node.js version
  local node_version=$(node --version | cut -c 2-)
  local required_version="20"
  if [[ "${node_version%%.*}" -lt "$required_version" ]]; then
    log_error "Node.js version $required_version or higher is required (found: v$node_version)"
    exit 1
  fi
  log_success "Node.js version: v$node_version"
  
  # Check if npm is available
  if ! command -v npm &> /dev/null; then
    log_error "npm is required but not installed"
    exit 1
  fi
  
  log_success "All dependencies are available"
}

install_dependencies() {
  log_step "Installing Dependencies"
  
  if [ "$VERBOSE" = true ]; then
    run_command "npm ci" "Dependency installation"
  else
    run_command "npm ci > /dev/null 2>&1" "Dependency installation"
  fi
}

lint_code() {
  log_step "Linting Code"
  
  cd packages/tests
  run_command "npm run lint" "Code linting"
  cd ../..
}

type_check() {
  log_step "Type Checking"
  
  cd packages/tests
  run_command "npm run typecheck" "TypeScript type checking"
  cd ../..
}

run_unit_tests() {
  log_step "Running Unit Tests with Coverage"
  
  export CI=true
  run_command "npm run test:unit" "Unit tests"
}

build_site() {
  if [ "$SKIP_BUILD" = true ]; then
    log_warning "Skipping site build as requested"
    return 0
  fi
  
  log_step "Building Site for E2E Tests"
  
  export NODE_ENV=test
  run_command "npm run build" "Site build"
}

install_playwright() {
  log_step "Installing Playwright Browsers"
  
  cd packages/tests
  if [ "$VERBOSE" = true ]; then
    run_command "npx playwright install --with-deps chromium firefox webkit" "Playwright browser installation"
  else
    run_command "npx playwright install --with-deps chromium firefox webkit > /dev/null 2>&1" "Playwright browser installation"
  fi
  cd ../..
}

run_e2e_tests() {
  if [ "$SKIP_E2E" = true ]; then
    log_warning "Skipping E2E tests as requested"
    return 0
  fi
  
  log_step "Running E2E Tests"
  
  export CI=true
  run_command "npm run test:e2e" "E2E tests"
}

check_bundle_size() {
  log_step "Checking Bundle Size"
  
  # Build for production if not already built
  if [[ ! -d "packages/site/public" ]] || [ "$SKIP_BUILD" = false ]; then
    log_info "Building site for bundle analysis..."
    run_command "npm run build" "Production build for bundle analysis"
  fi
  
  # Install bundlesize if not available
  if ! command -v bundlesize &> /dev/null; then
    log_info "Installing bundlesize globally..."
    run_command "npm install -g bundlesize" "Bundlesize installation"
  fi
  
  cd packages/site
  run_command "bundlesize" "Bundle size check"
  cd ../..
}

run_lighthouse() {
  log_step "Running Lighthouse Performance Tests"
  
  # Check if lighthouse CI is available
  if ! command -v lhci &> /dev/null; then
    log_info "Installing Lighthouse CI..."
    run_command "npm install -g @lhci/cli" "Lighthouse CI installation"
  fi
  
  # Start the server in background
  log_info "Starting development server..."
  npm run serve > /dev/null 2>&1 &
  local server_pid=$!
  
  # Wait for server to be ready
  log_info "Waiting for server to be ready..."
  sleep 10
  
  # Check if server is responding
  if ! curl -s http://localhost:9000 > /dev/null; then
    log_error "Server is not responding on port 9000"
    kill $server_pid 2>/dev/null || true
    return 1
  fi
  
  # Run Lighthouse
  local lighthouse_result=0
  if ! lhci autorun; then
    log_error "Lighthouse tests failed"
    lighthouse_result=1
  else
    log_success "Lighthouse tests passed"
  fi
  
  # Cleanup server
  kill $server_pid 2>/dev/null || true
  return $lighthouse_result
}

generate_report() {
  log_step "Generating CI Report"
  
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  local minutes=$((duration / 60))
  local seconds=$((duration % 60))
  
  echo -e "\n${GREEN}=====================================${NC}"
  echo -e "${GREEN}LOCAL CI VERIFICATION COMPLETE${NC}"
  echo -e "${GREEN}=====================================${NC}"
  echo -e "Total execution time: ${minutes}m ${seconds}s"
  echo -e "All checks passed! ${GREEN}✓${NC}"
  echo -e "\nYour code is ready for CI pipeline execution."
  echo -e "${GREEN}=====================================${NC}\n"
}

# Main execution flow
main() {
  log_info "Starting Local CI Verification"
  log_info "Arguments: VERBOSE=$VERBOSE, SKIP_BUILD=$SKIP_BUILD, SKIP_E2E=$SKIP_E2E"
  
  # Trap to cleanup on exit
  trap 'jobs -p | xargs -r kill; exit' INT TERM EXIT
  
  check_dependencies
  install_dependencies
  lint_code
  type_check
  run_unit_tests
  install_playwright
  build_site
  run_e2e_tests
  check_bundle_size
  run_lighthouse
  generate_report
  
  log_success "Local CI verification completed successfully!"
  exit 0
}

# Error handling
handle_error() {
  local line_no=$1
  local error_code=$2
  
  echo -e "\n${RED}=====================================${NC}"
  echo -e "${RED}LOCAL CI VERIFICATION FAILED${NC}"
  echo -e "${RED}=====================================${NC}"
  echo -e "Error occurred on line $line_no with exit code $error_code"
  echo -e "Check the output above for details."
  echo -e "${RED}=====================================${NC}\n"
  
  # Cleanup any background processes
  jobs -p | xargs -r kill 2>/dev/null || true
  
  exit $error_code
}

# Set error trap
trap 'handle_error ${LINENO} $?' ERR

# Run main function
main "$@"