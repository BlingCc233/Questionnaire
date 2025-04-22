package main

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// 数据库模型
type AnswerRecord struct {
	ID        uint     `gorm:"primaryKey"`
	Type      string   `gorm:"size:10;not null"`
	Timestamp int64    `gorm:"not null"`
	Answers   []Answer `gorm:"foreignKey:RecordID"`
}

type Answer struct {
	ID       uint   `gorm:"primaryKey"`
	RecordID uint   `gorm:"not null"`
	Question string `gorm:"size:3;not null"`
	Answer   string `gorm:"size:1;not null"`
}

// 请求数据结构
type SaveDataRequest struct {
	Type    string            `json:"type"`
	Answers map[string]string `json:"answers"`
}

// 删除记录请求结构
type ClearDataRequest struct {
	Type      string            `json:"type"`
	Timestamp int64             `json:"timestamp"`
	Answers   map[string]string `json:"answers"`
}

func main() {
	r := gin.Default()

	// 添加中间件允许所有跨域请求
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, Authorization")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	db, err := gorm.Open(sqlite.Open("answers.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// 自动迁移数据模型
	err = db.AutoMigrate(&AnswerRecord{}, &Answer{})
	if err != nil {
		panic("failed to migrate database")
	}

	r.POST("/savedata", func(c *gin.Context) {
		saveData(c, db)
	})
	r.POST("/cleardata", func(c *gin.Context) {
		clearData(c, db)
	})
	r.GET("/getdatabytype/:type", func(c *gin.Context) {
		getDataByType(c, db)
	})
	r.GET("/getdata", func(c *gin.Context) {
		getData(c, db)
	})
	r.GET("/downdb", func(c *gin.Context) {
		// 生成 CSV 文件
		filePath := "./answer.csv"
		if err := dbToCSV(db, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 定义下载文件名，这里使用纳秒级时间戳
		downloadName := fmt.Sprintf("%d.csv", time.Now().UnixNano())
		// 发送文件附件
		c.FileAttachment(filePath, downloadName)

		// 传输完成后，删除CSV文件
		// 注意：如果使用FileAttachment后立即删除，可能会出现文件未传输完毕就被删除的问题，
		// 在实际项目中可以采用异步处理或者将CSV内容写入内存再传输。
		go func() {
			// 等待1秒，确保文件已经被传输
			time.Sleep(3600 * time.Second)
			os.Remove(filePath)
		}()
	})

	r.Run(":5656")
}

// dbToCSV 查询数据库数据并将结果写入 CSV 文件
func dbToCSV(db *gorm.DB, filePath string) error {
	// 查询所有 AnswerRecord，预加载 Answers
	var records []AnswerRecord
	if err := db.Preload("Answers").Find(&records).Error; err != nil {
		return err
	}

	// 创建或覆盖 CSV 文件
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入 CSV 表头
	headers := []string{"RecordID", "Type", "Timestamp", "Question", "Answer"}
	if err := writer.Write(headers); err != nil {
		return err
	}

	// 写入数据，每行写入一个Question和Answer，其他字段一致（如果一个记录对应多个答案，则生成多行）
	for _, record := range records {
		for _, ans := range record.Answers {
			// 时间戳转为字符串，可以自行调整为期望格式
			row := []string{
				strconv.Itoa(int(record.ID)),
				record.Type,
				strconv.FormatInt(record.Timestamp, 10),
				ans.Question,
				ans.Answer,
			}
			if err := writer.Write(row); err != nil {
				return err
			}
		}
	}

	return nil
}

func saveData(c *gin.Context, db *gorm.DB) {
	var req SaveDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validTypes := map[string]bool{"index": true, "sub1": true, "sub2": true, "sub3": true}
	if !validTypes[req.Type] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type"})
		return
	}

	record := AnswerRecord{
		Type:      req.Type,
		Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&record).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for q, a := range req.Answers {
		answer := Answer{
			RecordID: record.ID,
			Question: q,
			Answer:   a,
		}
		if err := tx.Create(&answer).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "data saved successfully", "id": record.ID})
}

func getDataByType(c *gin.Context, db *gorm.DB) {
	typeParam := c.Param("type")

	var records []AnswerRecord
	result := db.Preload("Answers").Where("type = ?", typeParam).Find(&records)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var response []map[string]interface{}
	for _, record := range records {
		answersMap := make(map[string]string)
		for _, answer := range record.Answers {
			answersMap[answer.Question] = answer.Answer
		}

		response = append(response, map[string]interface{}{
			"type":      record.Type,
			"timestamp": record.Timestamp,
			"answers":   answersMap,
		})
	}

	c.JSON(http.StatusOK, response)
}

func getData(c *gin.Context, db *gorm.DB) {
	var records []AnswerRecord
	result := db.Preload("Answers").Find(&records)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var response []map[string]interface{}
	for _, record := range records {
		answersMap := make(map[string]string)
		for _, answer := range record.Answers {
			answersMap[answer.Question] = answer.Answer
		}

		response = append(response, map[string]interface{}{
			"type":      record.Type,
			"timestamp": record.Timestamp,
			"answers":   answersMap,
		})
	}

	c.JSON(http.StatusOK, response)
}

func clearData(c *gin.Context, db *gorm.DB) {
	var req ClearDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var records []AnswerRecord
	query := db.Where("type = ? AND timestamp = ?", req.Type, req.Timestamp)
	if len(req.Answers) > 0 {
		query = query.Preload("Answers").Joins(
			"JOIN answers ON answer_records.id = answers.record_id AND answers.answer IN (?)",
			getAnswerValues(req.Answers),
		)
	}

	if err := query.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(records) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "no matching records found"})
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, record := range records {
		if err := tx.Where("record_id = ?", record.ID).Delete(&Answer{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := tx.Delete(&record).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "data cleared successfully",
		"count":   len(records),
	})
}

func getAnswerValues(answers map[string]string) []string {
	values := make([]string, 0, len(answers))
	for _, v := range answers {
		values = append(values, v)
	}
	return values
}
