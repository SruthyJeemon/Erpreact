namespace Api.Models
{
    public class BrandRegistrationRequest
    {
        public string? Userid { get; set; }
        public string? Brand_id { get; set; }
        public string? Brand { get; set; }
        public string? Add_Date { get; set; }
        public string? Brand_Logo { get; set; }
        public string? Apluscontent { get; set; }
        public DateTime? Approved_Date { get; set; }
        public string? Approved_By { get; set; }
        public string? Brand_Status { get; set; }
        public string? Reason { get; set; }
        public string? Active_Status { get; set; }
        public int Query { get; set; }
    }
}
