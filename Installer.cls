Class Atlas.Installer
{
XData setup
{
<Manifest>
  <Default Name="Namespace" Value="ATLAS"/>
  <Default Name="database" Value="atlas"/>
  <Namespace Name="ATLAS" Code="ATLAS" Data="ATLAS" Create="yes" Ensemble="no">
    <Configuration>
      <Database Name="ATLAS" Dir="/usr/irissys/mgr/atlas/data" Create="yes" Resource="%DB_ATLAS"/>
    </Configuration>
  </Namespace>
</Manifest>
}
ClassMethod setup(ByRef pVars, pLogLevel As %Integer = 3, pInstaller As %Installer.Installer, pLogger As %Installer.AbstractLogger) As %Status [ CodeMode = objectgenerator, Internal ]
{
  Quit ##class(%Installer.Manifest).%Generate(%compiledclass, %code, "setup")
}
}