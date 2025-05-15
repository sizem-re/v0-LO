"use server"

import fs from "fs/promises"
import path from "path"

export async function saveEmail(email: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: "Please enter a valid email address." }
    }

    // Create emails directory if it doesn't exist
    const emailsDir = path.join(process.cwd(), "emails")
    try {
      await fs.access(emailsDir)
    } catch {
      await fs.mkdir(emailsDir, { recursive: true })
    }

    // Path to the emails.txt file
    const filePath = path.join(emailsDir, "emails.txt")

    // Check if file exists, create it if it doesn't
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, "")
    }

    // Read existing emails to check for duplicates
    const existingEmails = await fs.readFile(filePath, "utf-8")
    const emailList = existingEmails.split("\n").filter(Boolean)

    // Check if email already exists
    if (emailList.includes(email)) {
      return { success: false, message: "This email is already registered." }
    }

    // Append the new email with timestamp
    const timestamp = new Date().toISOString()
    await fs.appendFile(filePath, `${email} - ${timestamp}\n`)

    return { success: true }
  } catch (error) {
    console.error("Error saving email:", error)
    return { success: false, message: "Failed to save email. Please try again." }
  }
}
