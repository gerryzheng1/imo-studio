import pathlib,subprocess,json
P=pathlib.Path(__file__).parent
out=subprocess.run(['cscript.exe','//Nologo',str(P/'validate_excel.vbs')],capture_output=True)
text=out.stdout.decode('mbcs',errors='replace')
(P/'excel-qa').mkdir(exist_ok=True)
(P/'excel-qa/native-log.txt').write_text(text+'\nSTDERR\n'+out.stderr.decode('mbcs',errors='replace'),encoding='utf-8')
print(text.encode('ascii',errors='backslashreplace').decode())
print('EXIT',out.returncode)
