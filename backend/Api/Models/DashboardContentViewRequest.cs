namespace Api.Models;

public class DashboardContentViewRequest
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string ContentSectionId { get; set; } = string.Empty;
    public string ContentSectionName { get; set; } = string.Empty;
    public string IsVisible { get; set; } = "No";
    public string Status { get; set; } = "Active";
    public DateTime Enterdate { get; set; } = DateTime.Now;
}
