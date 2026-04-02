namespace Api.Models;

public class DateFormatResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DateFormatData>? DateFormats { get; set; }
    public List<DateFormatData>? Data { get; set; } // Alternative property name for compatibility
}

public class DateFormatData
{
    public int Id { get; set; }
    public string? Dateformat { get; set; }
    public string? Isdelete { get; set; }
}
