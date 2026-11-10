[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Users\Lenovo\.jdks\jbr-21.0.11', 'Process')
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\Lenovo\AppData\Local\Android\Sdk', 'Process')

Set-Location -Path 'C:\Users\Lenovo\antigravity\evoscan-\android'
$gradleBat = 'C:\Users\Lenovo\.gradle\wrapper\dists\gradle-8.9-bin\90cnw93cvbtalezasaz0blq0a\gradle-8.9\bin\gradle.bat'

Write-Host "Building Evoscan Android App Bundle (.aab) and APK using Java 21..."
& $gradleBat bundleRelease assembleRelease --no-daemon --stacktrace
if ($LASTEXITCODE -eq 0) {
    Write-Host "Android Build SUCCESSFUL!"
} else {
    Write-Error "Android Build Failed with code $LASTEXITCODE"
}
