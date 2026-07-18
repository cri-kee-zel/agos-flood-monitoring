# AGOS PowerShell Deployment Workflow

Use this workflow for all updates in this project.

## 1. Update the project locally

Run this in PowerShell from the project root:

```powershell
./scripts/deploy-and-verify.ps1 -CommitMessage "Your update message"
```

## 2. What it does

- Refreshes the public folder with the latest main and module files
- Regenerates runtime config if available
- Verifies that the key files exist in public
- Stages, commits, and pushes changes to GitHub
- Triggers Render deploy if RENDER_API_KEY and RENDER_SERVICE_ID are set

## 3. Useful variants

```powershell
./scripts/deploy-and-verify.ps1 -CommitMessage "Quick fix" -SkipRender
./scripts/deploy-and-verify.ps1 -CommitMessage "No git push" -SkipGit -SkipRender
```

## 4. Manual verification

```powershell
node server.js
Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing
```
