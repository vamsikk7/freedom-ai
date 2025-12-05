package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"go.mongodb.org/mongo-driver/mongo"
)

type PDFHandler struct {
	db *mongo.Database
}

func NewPDFHandler(db *mongo.Database) *PDFHandler {
	return &PDFHandler{db: db}
}

// ExportMonthlyReportPDF exports monthly report as PDF
func (h *PDFHandler) ExportMonthlyReportPDF(c *gin.Context) {
	orgID := c.Query("organizationId")
	month := c.Query("month")

	if orgID == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId and month are required"})
		return
	}

	// Create a basic PDF report
	// In production, you would fetch actual data from the database
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Monthly Consumption Report")
	pdf.Ln(20)

	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 10, "Organization: "+orgID)
	pdf.Ln(10)
	pdf.Cell(40, 10, "Month: "+month)
	pdf.Ln(20)

	// Add more content based on report data
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Summary")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 10, "This report contains consumption data for the specified month.")
	pdf.Ln(10)
	pdf.Cell(40, 10, "For detailed data, please use the CSV or JSON export options.")

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=monthly-report-"+month+".pdf")
	pdf.Output(c.Writer)
}
