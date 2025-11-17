# Security Policy

## 🔒 Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## 🚨 Reporting a Vulnerability

We take the security of WhatsApp Campaign Sender seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not:
- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please Do:
1. **Email** the details to the repository maintainers (create a security advisory on GitHub)
2. **Include** as much information as possible:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect:
- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We will send you regular updates about our progress
- **Timeline**: We aim to address critical vulnerabilities within 7 days
- **Credit**: If you wish, we will publicly acknowledge your responsible disclosure

## 🛡️ Security Best Practices

When deploying this application:

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique values for `WEBHOOK_VERIFY_TOKEN`
- Rotate API tokens regularly
- Use environment-specific credentials

### WhatsApp API
- Keep your `WHATSAPP_TOKEN` secure and private
- Use temporary tokens for development
- Implement proper access controls
- Monitor API usage for anomalies

### Database
- Use strong PostgreSQL passwords
- Restrict database access to necessary services only
- Enable SSL/TLS for database connections in production
- Regular backups and security updates

### Docker Deployment
- Don't run containers as root
- Use official base images
- Keep Docker and images updated
- Scan images for vulnerabilities

### Network Security
- Use HTTPS for all production deployments
- Implement rate limiting
- Use a reverse proxy (nginx, Caddy)
- Enable CORS only for trusted domains

### Contact Data
- Ensure GDPR/privacy compliance
- Implement opt-in/opt-out mechanisms
- Secure contact data storage
- Regular data audits

## 🔐 Known Security Considerations

### Rate Limiting
The application implements per-country rate limiting. Ensure you configure appropriate limits for your use case.

### Webhook Verification
Always verify webhook requests using the `WEBHOOK_VERIFY_TOKEN` to prevent unauthorized access.

### Input Validation
All user inputs are validated using Zod schemas. Do not bypass these validations.

## 📚 Additional Resources

- [WhatsApp Cloud API Security Best Practices](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 📞 Contact

For security-related questions or concerns, please use GitHub's security advisory feature or contact the maintainers directly.

Thank you for helping keep WhatsApp Campaign Sender and its users safe! 🙏

