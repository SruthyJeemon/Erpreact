namespace Api.Models;

public class ModuleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ModuleData>? Modules { get; set; }
}

public class ModuleData
{
    public int Id { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
}