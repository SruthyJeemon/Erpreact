namespace Api.Models;

public class DashboardContentViewResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DashboardContentViewData>? DashboardContentViews { get; set; }
}

public class DashboardContentViewData
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string ContentSectionId { get; set; } = string.Empty;
    public string ContentSectionName { get; set; } = string.Empty;
    public string IsVisible { get; set; } = "No";
    public string Status { get; set; } = "Active";
    public DateTime Enterdate { get; set; }
}
