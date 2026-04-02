namespace Api.Models;

public class EmailSettingsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<EmailSettingsData>? EmailSettings { get; set; }
}

public class EmailSettingsData
{
    public int Id { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public string? SmtpHost { get; set; }
    public string? ServerPort { get; set; }
}
