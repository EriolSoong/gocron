package notify

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/ouqiang/gocron/internal/models"
	"github.com/ouqiang/gocron/internal/modules/logger"
)

type Feishu struct{}

type feishuCard struct {
	Config   feishuConfig    `json:"config"`
	Header   feishuHeader    `json:"header"`
	Elements []feishuElement `json:"elements"`
}

type feishuConfig struct {
	WideScreenMode bool `json:"wide_screen_mode"`
}

type feishuHeader struct {
	Title feishuText `json:"title"`
}

type feishuElement struct {
	Tag     string        `json:"tag"`
	Content interface{}   `json:"content,omitempty"`
	Fields  []feishuField `json:"fields,omitempty"`
}

type feishuField struct {
	IsShort bool       `json:"is_short"`
	Text    feishuText `json:"text"`
}

type feishuText struct {
	Tag     string `json:"tag"`
	Content string `json:"content"`
}

type feishuMessage struct {
	MsgType string      `json:"msg_type"`
	Card    feishuCard  `json:"card,omitempty"`
	Content interface{} `json:"content,omitempty"`
}

func (f *Feishu) Send(msg Message) {
	model := new(models.Setting)
	feishuSetting, err := model.Feishu()
	if err != nil {
		logger.Error("#feishu#从数据库获取飞书配置失败", err)
		return
	}
	if feishuSetting.Url == "" {
		logger.Error("#feishu#Webhook URL为空")
		return
	}

	template := feishuSetting.Template
	if template == "" {
		template = defaultNotifyTemplate
	}

	content := parseNotifyTemplate(template, msg)

	card := feishuCard{
		Config: feishuConfig{WideScreenMode: true},
		Header: feishuHeader{
			Title: feishuText{Tag: "plain_text", Content: "gocron 任务通知"},
		},
		Elements: []feishuElement{
			{
				Tag:     "markdown",
				Content: content,
			},
		},
	}

	body := feishuMessage{
		MsgType: "interactive",
		Card:    card,
	}

	jsonData, err := json.Marshal(body)
	if err != nil {
		logger.Errorf("飞书消息序列化失败: %s", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	var req *http.Request
	req, err = http.NewRequest("POST", feishuSetting.Url, bytes.NewReader(jsonData))
	if err != nil {
		logger.Errorf("飞书创建请求失败: %s", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// 签名校验
	if feishuSetting.Secret != "" {
		timestamp := strconv.FormatInt(time.Now().Unix(), 10)
		sign := genFeishuSign(timestamp, feishuSetting.Secret)
		req.Header.Set("X-Lark-Request-Timestamp", timestamp)
		req.Header.Set("X-Lark-Request-Signature", sign)
	}

	resp, err := client.Do(req)
	if err != nil {
		logger.Errorf("飞书发送消息失败: %s", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := ioutil.ReadAll(resp.Body)
	logger.Debugf("飞书通知响应: %s", string(respBody))
}

func genFeishuSign(timestamp string, secret string) string {
	stringToSign := timestamp + "\n" + secret
	h := hmac.New(sha256.New, []byte(stringToSign))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
