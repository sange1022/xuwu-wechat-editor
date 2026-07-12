!macro customInit
  nsExec::ExecToStack 'taskkill /IM "戌無公众号排版工具.exe" /F'
  Pop $0
  Pop $1
  Sleep 1000
!macroend
