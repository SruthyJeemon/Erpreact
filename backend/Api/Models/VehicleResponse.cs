namespace Api.Models;

public class VehicleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<VehicleData>? Vehicles { get; set; }
    public List<VehicleData>? Data { get; set; } // Alternative property name for compatibility
}

public class VehicleData
{
    public int Id { get; set; }
    public string? Vehiclename { get; set; }
    public string? Vehicleno { get; set; }
    public string? Isdelete { get; set; }
}
