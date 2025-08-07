import React, { useState } from "react"

const TailwindUIForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    message: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const apiUrl = process.env.GATSBY_BACKEND_URL

    // Add your form submission logic here
    console.log("API :", apiUrl)
    console.log("Form submitted:", formData)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-component px-element sm:px-component lg:px-section">
      <div className="w-full max-w-md space-y-component">
        <div className="bg-card py-section-sm px-component shadow-md rounded-lg border">
          <h2 className="text-heading-lg font-bold text-foreground text-center">
            Create Your Account
          </h2>
          <form className="mt-component space-y-component" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="block text-body-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full px-element py-element-sm border border-border rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-body-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-body-sm font-medium text-foreground"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-element py-element-sm border border-border rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-body-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-body-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-element py-element-sm border border-border rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-body-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-body-sm font-medium text-foreground"
              >
                Message (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full px-element py-element-sm border border-border rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-body-sm bg-background text-foreground"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-element-sm px-element border border-transparent rounded-md shadow-sm text-body-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TailwindUIForm
