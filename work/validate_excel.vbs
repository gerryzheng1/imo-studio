Option Explicit
Dim fso, app, work, qa, scenario, folder, file, book, sheet, i, id, master, errText, temp, count
Set fso = CreateObject("Scripting.FileSystemObject")
work = fso.GetParentFolderName(WScript.ScriptFullName)
qa = fso.BuildPath(work, "excel-qa")
If Not fso.FolderExists(qa) Then fso.CreateFolder qa
Set app = CreateObject("Excel.Application")
app.Visible = False
app.DisplayAlerts = False
app.AskToUpdateLinks = False
app.AutomationSecurity = 3
app.EnableEvents = False
WScript.Echo "EXCEL_VERSION|" & app.Version
For Each scenario In Array("baseline", "overflow", "reduced", "departure")
  Set folder = fso.GetFolder(fso.BuildPath(work, "generated\" & scenario))
  For Each file In folder.Files
    If LCase(fso.GetExtensionName(file.Name)) = "xlsx" Then
      Set book = Nothing
      On Error Resume Next
      Err.Clear
      Set book = app.Workbooks.Open(file.Path, 0, True)
      errText = Err.Description
      On Error GoTo 0
      If book Is Nothing Then
        WScript.Echo "FAILED|" & scenario & "|" & file.Name & "|" & errText
      Else
        app.CalculateFullRebuild
        id = Split(file.Name, ".")(0)
        master = ""
        If id = "1" Or id = "2" Then master = book.Worksheets(1).Range("L31").Value2
        WScript.Echo "OPENED|" & scenario & "|" & file.Name & "|" & book.Worksheets.Count & "|" & master
        For i = 1 To book.Worksheets.Count
          Set sheet = book.Worksheets(i)
          WScript.Echo "SHEET|" & scenario & "|" & id & "|" & i & "|" & sheet.Name & "|" & sheet.PageSetup.PrintArea & "|" & sheet.PageSetup.Orientation & "|" & sheet.PageSetup.PaperSize & "|" & sheet.Shapes.Count
          If scenario = "baseline" Then
            count = app.WorksheetFunction.CountA(sheet.UsedRange)
            If count > 0 Then
              On Error Resume Next
              Err.Clear
              sheet.ExportAsFixedFormat 0, fso.BuildPath(qa, "baseline-" & id & "-sheet" & i & ".pdf")
              If Err.Number <> 0 Then WScript.Echo "PDF_FAILED|" & file.Name & "|" & Err.Description
              On Error GoTo 0
            End If
          End If
          Set sheet = Nothing
        Next
        book.Close False
        Set book = Nothing
      End If
    End If
  Next
Next
For Each file In fso.GetFolder(fso.BuildPath(work, "templates")).Files
  If LCase(fso.GetExtensionName(file.Name)) = "xlsx" Then
    Set book = app.Workbooks.Open(file.Path, 0, True)
    id = Split(file.Name, ".")(0)
    For i = 1 To book.Worksheets.Count
      Set sheet = book.Worksheets(i)
      On Error Resume Next
      Err.Clear
      sheet.ExportAsFixedFormat 0, fso.BuildPath(qa, "original-" & id & "-sheet" & i & ".pdf")
      If Err.Number <> 0 Then WScript.Echo "PDF_FAILED|" & file.Name & "|" & Err.Description
      On Error GoTo 0
    Next
    book.Close False
    Set book = Nothing
  End If
Next
app.Quit
Set app = Nothing
WScript.Echo "COMPLETE"
