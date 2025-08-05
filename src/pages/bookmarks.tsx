// Redirect to /reading
import { navigate } from "gatsby"
import { useEffect } from "react"

const BookmarksPage = () => {
  useEffect(() => {
    navigate("/reading", { replace: true })
  }, [])

  return null
}

export default BookmarksPage