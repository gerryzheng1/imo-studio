$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$qaDir = Join-Path $PSScriptRoot 'excel-qa'
New-Item -ItemType Directory -Force -Path $qaDir | Out-Null
$excel = $null
$records = [System.Collections.Generic.List[object]]::new()
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    $excel.AutomationSecurity = 3
    $excel.EnableEvents = $false
    foreach ($scenario in @('baseline','overflow','reduced','departure')) {
        $files = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot "generated\$scenario") -Filter '*.xlsx' | Sort-Object Name
        foreach ($file in $files) {
            $book = $null
            try {
                $book = $excel.Workbooks.Open($file.FullName, 0, $true)
                $excel.CalculateFullRebuild()
                $sheets = [System.Collections.Generic.List[object]]::new()
                for ($i = 1; $i -le $book.Worksheets.Count; $i++) {
                    $sheet = $book.Worksheets.Item($i)
                    $sheets.Add([pscustomobject]@{ name = $sheet.Name; usedRange = $sheet.UsedRange.Address(); printArea = $sheet.PageSetup.PrintArea; orientation = $sheet.PageSetup.Orientation; paper = $sheet.PageSetup.PaperSize; shapes = $sheet.Shapes.Count })
                    if ($scenario -eq 'baseline') {
                        $id = [regex]::Match($file.Name, '^\d+').Value
                        $pdfPath = Join-Path $qaDir ("baseline-" + $id + "-sheet" + $i + '.pdf')
                        $sheet.ExportAsFixedFormat(0, $pdfPath)
                    }
                    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
                }
                $id = [int][regex]::Match($file.Name, '^\d+').Value
                $sign = if ($id -in @(1,2)) { $book.Worksheets.Item(1).Range('L31').Value2 } else { $null }
                $records.Add([pscustomobject]@{ scenario=$scenario; file=$file.Name; opened=$true; format=$book.FileFormat; sheetCount=$book.Worksheets.Count; masterFormulaResult=$sign; sheets=$sheets.ToArray() })
                Write-Output ("OPENED " + $scenario + ' / ' + $file.Name + ' / sheets=' + $book.Worksheets.Count)
            } catch {
                $records.Add([pscustomobject]@{ scenario=$scenario; file=$file.Name; opened=$false; error=$_.Exception.Message })
                Write-Output ("FAILED " + $scenario + ' / ' + $file.Name + ' / ' + $_.Exception.Message)
            } finally {
                if ($null -ne $book) { $book.Close($false); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($book) }
            }
        }
    }
    foreach ($file in (Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'templates') -Filter '*.xlsx')) {
        $book = $null
        try {
            $book = $excel.Workbooks.Open($file.FullName, 0, $true)
            for ($i=1; $i -le $book.Worksheets.Count; $i++) {
                $sheet=$book.Worksheets.Item($i)
                $id=[regex]::Match($file.Name,'^\d+').Value
                $pdfPath=Join-Path $qaDir ("original-"+$id+"-sheet"+$i+'.pdf')
                $sheet.ExportAsFixedFormat(0,$pdfPath)
                [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
            }
        } finally { if ($null -ne $book) { $book.Close($false); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($book) } }
    }
} finally {
    $records.ToArray() | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $qaDir 'native-excel-results.json') -Encoding utf8
    if ($null -ne $excel) { $excel.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
    [GC]::Collect();[GC]::WaitForPendingFinalizers()
}
