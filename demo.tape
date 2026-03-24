# Risk Guard Demo — VHS recording script
# Usage: brew install vhs && vhs demo.tape
# Generates: demo.gif

Output demo.gif
Set Shell "bash"
Set FontSize 14
Set Width 900
Set Height 550
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

# 1. Check status
Type "risk-guard status"
Enter
Sleep 2s

# 2. Test: safe command — instant allow
Type "risk-guard test ls -la"
Enter
Sleep 2s

# 3. Test: medium risk — auto-allow with notification
Type "risk-guard test npm install express"
Enter
Sleep 8s

# 4. Test: high risk — blocked!
Type "risk-guard test rm -rf /"
Enter
Sleep 8s

# 5. Verbose mode — show evaluation flow
Type "risk-guard test --verbose git push"
Enter
Sleep 8s

# 6. Stats dashboard
Type "risk-guard stats"
Enter
Sleep 3s

# 7. Custom rules
Type "risk-guard rules"
Enter
Sleep 2s

# 8. Version
Type "risk-guard version"
Enter
Sleep 2s
