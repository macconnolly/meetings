const fs = require('fs').promises;
const path = require('path');

class EmailProcessor {
    constructor(config) {
        this.config = config;
    }

    async extractTranscript(filePath) {
        try {
            const fileExtension = path.extname(filePath).toLowerCase();
            let transcript;
            
            if (fileExtension === '.eml') {
                transcript = await this.parseEmlFile(filePath);
            } else {
                // Handle .txt and other formats
                transcript = await fs.readFile(filePath, 'utf-8');
            }
            
            console.log(`Successfully extracted transcript from ${filePath}`);
            return { transcript };
        } catch (error) {
            console.error(`Error reading transcript file at ${filePath}:`, error);
            return { transcript: null, error: 'Failed to read transcript file.' };
        }
    }

    async parseEmlFile(filePath) {
        try {
            const emailContent = await fs.readFile(filePath, 'utf-8');
            
            // Extract subject
            const subjectMatch = emailContent.match(/^Subject:\s*(.*)$/m);
            const subject = subjectMatch ? subjectMatch[1].trim() : 'No Subject';
            
            // Find the transcript content - look for "Transcript:" marker
            let transcript = '';
            const transcriptMatch = emailContent.match(/Transcript:\s*([\s\S]*?)$/m);
            
            if (transcriptMatch) {
                // Extract the actual transcript content
                transcript = transcriptMatch[1].trim();
            } else {
                // Fallback: extract content after Content-Type: text/plain
                const plainTextMatch = emailContent.match(/Content-Type:\s*text\/plain[^]*?\n\n([\s\S]*?)(?=\n----_|$)/);
                if (plainTextMatch) {
                    transcript = plainTextMatch[1]
                        .replace(/=\r?\n/g, '') // Remove quoted-printable line breaks
                        .replace(/=([0-9A-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))) // Decode quoted-printable
                        .trim();
                }
            }
            
            // Format as a structured transcript with metadata
            const formattedTranscript = `Meeting: ${subject}\n\n${transcript}`;
            
            console.log(`Successfully parsed EML file: ${filePath}`);
            console.log(`Subject: ${subject}`);
            console.log(`Transcript length: ${transcript.length} characters`);
            
            return formattedTranscript;
        } catch (error) {
            console.error(`Error parsing EML file ${filePath}:`, error);
            throw error;
        }
    }

    async sendEmail(emailDetails) {
        // Placeholder for sending email logic
        console.log("Simulating sending email:", emailDetails);
        // In a real implementation, this would use an email service like SendGrid or Nodemailer
        return { success: true, messageId: `simulated-${Date.now()}` };
    }
}

module.exports = { EmailProcessor };
