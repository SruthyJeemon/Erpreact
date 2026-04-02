namespace Api.Models;

public class VehicleRequest
{
    public int? Id { get; set; }
    public string? Vehiclename { get; set; }
    public string? Vehicleno { get; set; }
    public string? Isdelete { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Select All, 4=Soft Delete
}
