package notify

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/ouqiang/gocron/internal/models"
	"github.com/ouqiang/gocron/internal/modules/logger"
)

type WeCom struct{}

type weComMessage struct {
	MsgType  string        `json:"msgtype"`
	Markdown *weComMarkdown `json:"markdown,omitempty"`
	Text     *weComText    `json:"text,omitempty"`
}

type weComMarkdown struct {
	Content string `json:"content"`
}

type weComText struct {
	Content string `json:"content"`
}

func (w *WeCom) Send(msg Message) {
	model := new(models.Setting)
	weComSetting, err := model.WeCom()
	if err != nil {
		logger.Error("#wecom#从数据库获取企业微信配置失败", err)
		return
	}
	if weComSetting.Url == "" {
		logger.Error("#wecom#Webhook URL为空")
		return
	}

	template := weComSetting.Template
	if template == "" {
		template = defaultNotifyTemplate
	}

	content := parseNotifyTemplate(template, msg)

	body := weComMessage{
		MsgType:  "markdown",
		Markdown: &weComMarkdown{Content: content},
	}

	jsonData, err := json.Marshal(body)
	if err != nil {
		logger.Errorf("企业微信消息序列化失败: %s", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", weComSetting.Url, bytes.NewReader(jsonData))
	if err != nil {
		logger.Errorf("企业微信创建请求失败: %s", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		logger.Errorf("企业微信发送消息失败: %s", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := ioutil.ReadAll(resp.Body)
	logger.Debugf("企业微信通知响应: %s", string(respBody))
}
