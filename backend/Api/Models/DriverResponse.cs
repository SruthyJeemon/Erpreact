namespace Api.Models;

public class DriverResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DriverData>? Drivers { get; set; }
    public List<DriverData>? Data { get; set; } // Alternative property name for compatibility
}

public class DriverData
{
    public int Id { get; set; }
    public string? Drivername { get; set; }
    public string? Licenseno { get; set; }
    public string? Mobileno { get; set; }
    public string? Type { get; set; }
    public string? Isdelete { get; set; }
}
