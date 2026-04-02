namespace Api.Models;

public class DriverRequest
{
    public int? Id { get; set; }
    public string? Drivername { get; set; }
    public string? Licenseno { get; set; }
    public string? Mobileno { get; set; }
    public string? Type { get; set; }
    public string? Isdelete { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Select All, 4=Soft Delete
}
