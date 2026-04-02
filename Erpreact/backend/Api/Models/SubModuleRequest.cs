namespace Api.Models;

public class SubModuleRequest
{
    public int? Id { get; set; }
    public string SubModuleName { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete, 5=Search
}