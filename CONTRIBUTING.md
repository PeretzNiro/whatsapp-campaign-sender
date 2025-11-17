# Contributing to WhatsApp Campaign Sender

Thank you for your interest in contributing to WhatsApp Campaign Sender! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- **Clear title** describing the problem
- **Detailed description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** (if applicable)
- **Environment details** (OS, Node.js version, Docker version)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- **Clear title** describing the feature
- **Detailed description** of the proposed functionality
- **Use case** explaining why this feature would be valuable
- **Possible implementation** (if you have ideas)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Commit your changes** with clear, descriptive messages
6. **Push to your fork** and submit a pull request

## 💻 Development Setup

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/whatsapp-campaign-sender.git
cd whatsapp-campaign-sender

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:push

# Start backend (in one terminal)
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Provide proper type annotations
- Avoid `any` types when possible

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing code patterns

### Naming Conventions
- **Files**: camelCase for TypeScript files (e.g., `contactParser.ts`)
- **Components**: PascalCase for React components (e.g., `ContactList.tsx`)
- **Variables**: camelCase (e.g., `phoneNumber`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces/Types**: PascalCase (e.g., `ContactData`)

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Examples:
```
feat: Add contact import from Excel
fix: Resolve rate limiting issue for US numbers
docs: Update API endpoint documentation
refactor: Simplify phone number validation logic
test: Add tests for campaign sender
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd frontend
npm test
```

### Writing Tests
- Write tests for new features
- Ensure existing tests pass
- Aim for good code coverage
- Test edge cases and error conditions

## 📚 Documentation

- Update README.md if you change functionality
- Add JSDoc comments for functions and classes
- Update API documentation for endpoint changes
- Include code examples where helpful

## 🔍 Code Review Process

1. All submissions require review
2. Reviewers will check:
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Breaking changes
3. Address review feedback promptly
4. Maintain a respectful and constructive tone

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to:
- Open an issue for questions
- Start a discussion in GitHub Discussions
- Reach out to maintainers

Thank you for contributing! 🎉

