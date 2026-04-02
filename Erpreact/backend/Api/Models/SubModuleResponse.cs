namespace Api.Models;

public class SubModuleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SubModuleData>? SubModules { get; set; }
}

public class SubModuleData
{
    public int Id { get; set; }
    public string SubModuleName { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}