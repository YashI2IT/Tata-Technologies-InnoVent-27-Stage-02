[Setup]
AppName=AeroEdge-X
AppVersion=1.0.0
DefaultDirName={localappdata}\Programs\AeroEdge-X
DefaultGroupName=AeroEdge-X
OutputBaseFilename=AeroEdge-X-Setup-v2
OutputDir=output
Compression=lzma2/fast
SolidCompression=no
SetupIconFile=..\frontend\public\logo.ico
UninstallDisplayIcon={app}\AeroEdge-X.exe
PrivilegesRequired=lowest

[Files]
; Main Electron Desktop Shell
Source: "..\build\windows\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Pre-built PyInstaller backend (copied as a standard directory, NO solid compression)
Source: "..\build\windows\backend\aeroedge-backend\*"; DestDir: "{app}\resources\aeroedge-backend"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\AeroEdge-X"; Filename: "{app}\AeroEdge-X.exe"
Name: "{userdesktop}\AeroEdge-X"; Filename: "{app}\AeroEdge-X.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"
