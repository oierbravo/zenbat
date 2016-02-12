nssm.exe install zenbat launch.exe
nssm.exe set zenbat DisplayName Zenbat
nssm.exe set zenbat Description Zenbat, ezarri 2000
nssm.exe set zenbat AppDirectory C:\Users\IXI\nodejs\mean-zenbat
nssm.exe set zenbat Start SERVICE_AUTO_START
net start zenbat