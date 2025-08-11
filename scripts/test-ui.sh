#!/bin/bash

# UI Testing Script with Docker
# Comprehensive UI testing suite using Docker containers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
UI Testing Script with Docker

Usage: $0 [OPTIONS] [TEST_TYPE]

TEST_TYPES:
    all                 Run all UI tests (default)
    visual              Visual regression tests only
    accessibility       Accessibility tests only  
    performance         Performance tests only
    cross-browser       Cross-browser compatibility tests
    production          Test against production build
    
OPTIONS:
    -h, --help          Show this help message
    -c, --clean         Clean up containers and volumes first
    -u, --update        Update visual snapshots
    -v, --verbose       Enable verbose logging
    --headed            Run tests in headed mode (where possible)
    --debug             Enable debug mode with extra logging
    
EXAMPLES:
    $0                                  # Run all tests
    $0 visual --update                  # Update visual regression baselines
    $0 accessibility --verbose         # Run accessibility tests with verbose output
    $0 production                       # Test against production Docker build
    $0 --clean performance              # Clean containers and run performance tests

EOF
}

# Parse arguments
TEST_TYPE="all"
CLEAN=false
UPDATE_SNAPSHOTS=false
VERBOSE=false
HEADED=false
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -u|--update)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --debug)
            DEBUG=true
            VERBOSE=true
            shift
            ;;
        visual|accessibility|performance|cross-browser|production|all)
            TEST_TYPE=$1
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set environment variables
export CI=true
export NODE_ENV=test

if [[ "$DEBUG" == "true" ]]; then
    export DEBUG="pw:*"
fi

if [[ "$VERBOSE" == "true" ]]; then
    export VERBOSE=1
fi

# Cleanup function
cleanup() {
    if [[ "$CLEAN" == "true" ]]; then
        log "Cleaning up Docker containers and volumes..."
        docker-compose -f docker/docker-compose.ui-test.yml down -v --remove-orphans 2>/dev/null || true
        docker system prune -f --volumes 2>/dev/null || true
        success "Cleanup completed"
    fi
}

# Build site first
build_site() {
    log "Building site for testing..."
    pnpm build
    success "Site build completed"
}

# Run specific test type
run_tests() {
    local test_type=$1
    local compose_file="docker/docker-compose.ui-test.yml"
    
    case $test_type in
        "visual")
            log "Running visual regression tests..."
            local service="visual-tests"
            local extra_args=""
            
            if [[ "$UPDATE_SNAPSHOTS" == "true" ]]; then
                extra_args="--update-snapshots"
            fi
            
            docker-compose -f "$compose_file" run --rm "$service" --project=visual-regression $extra_args
            ;;
            
        "accessibility")
            log "Running accessibility tests..."
            docker-compose -f "$compose_file" run --rm accessibility-tests
            ;;
            
        "performance")
            log "Running performance tests..."
            docker-compose -f "$compose_file" run --rm performance-tests
            ;;
            
        "cross-browser")
            log "Running cross-browser compatibility tests..."
            docker-compose -f "$compose_file" run --rm ui-tests --project=cross-browser-chrome --project=cross-browser-firefox --project=cross-browser-safari
            ;;
            
        "production")
            log "Building production environment..."
            docker-compose -f "$compose_file" up -d production-site
            sleep 10  # Wait for production site to be ready
            
            log "Running tests against production build..."
            docker-compose -f "$compose_file" run --rm production-ui-tests
            
            log "Cleaning up production environment..."
            docker-compose -f "$compose_file" down production-site
            ;;
            
        "all")
            log "Running complete UI test suite..."
            
            # Run different test types in sequence
            run_tests "cross-browser"
            run_tests "accessibility" 
            run_tests "performance"
            
            # Visual tests last (might update snapshots)
            if [[ "$UPDATE_SNAPSHOTS" == "true" ]]; then
                run_tests "visual"
            else
                run_tests "visual"
            fi
            ;;
            
        *)
            error "Unknown test type: $test_type"
            exit 1
            ;;
    esac
}

# Main execution
main() {
    log "Starting UI testing suite..."
    log "Test type: $TEST_TYPE"
    
    # Check dependencies
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is required but not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is required but not installed"
        exit 1
    fi
    
    # Cleanup if requested
    cleanup
    
    # Build the site
    build_site
    
    # Create results directory
    mkdir -p test-results playwright-report
    
    # Run the tests
    log "Starting test execution..."
    if run_tests "$TEST_TYPE"; then
        success "All tests completed successfully!"
        
        # Show results location
        if [[ -d "test-results" ]]; then
            log "Test results available in: test-results/"
        fi
        
        if [[ -d "playwright-report" ]]; then
            log "HTML report available in: playwright-report/"
            log "Open playwright-report/index.html in your browser to view detailed results"
        fi
        
    else
        error "Some tests failed. Check the output above for details."
        exit 1
    fi
    
    # Cleanup containers (keep volumes for results)
    if [[ "$CLEAN" == "true" ]]; then
        log "Cleaning up test containers..."
        docker-compose -f docker/docker-compose.ui-test.yml down --remove-orphans
    fi
    
    success "UI testing suite completed!"
}

# Execute main function
main "$@"