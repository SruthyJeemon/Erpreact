namespace Api.Models
{
    public class TaskCategoryRequest
    {
        public int? RegistrationId { get; set; }
        public int Query { get; set; } = 1;
    }

    public class TaskCategoryResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public List<TaskCategoryData> Data { get; set; } = new();
    }

    public class TaskCategoryData
    {
        public int Id { get; set; }
        public string Category { get; set; } = "";
        public string Catelogid { get; set; } = "";
    }
}
