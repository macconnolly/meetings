const fs = require('fs').promises;
const path = require('path');
const emlFormat = require('eml-format');

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
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8')
                .then(emlContent => {
                    emlFormat.read(emlContent, (error, data) => {
                        if (error) {
                            console.error(`Error parsing EML file ${filePath}:`, error);
                            return reject(error);
                        }

                        const subject = data.subject || 'No Subject';
                        let transcript = '';
                        if (data.text) {
                            transcript = data.text.trim();
                        }

                        const formattedTranscript = `Meeting: ${subject}\n\n${transcript}`;
                        console.log(`Successfully parsed EML file: ${filePath}`);
                        console.log(`Subject: ${subject}`);
                        console.log(`Transcript length: ${transcript.length} characters`);
                        resolve(formattedTranscript);
                    });
                })
                .catch(error => {
                    console.error(`Error reading EML file ${filePath}:`, error);
                    reject(error);
                });
        });
    }

    async sendEmail(emailDetails) {
        // Placeholder for sending email logic
        console.log("Simulating sending email:", emailDetails);
        // In a real implementation, this would use an email service like SendGrid or Nodemailer
        return { success: true, messageId: `simulated-${Date.now()}` };
    }
}

module.exports = { EmailProcessor };
