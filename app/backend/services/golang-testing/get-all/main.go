package main

import (
	"github.com/kjakopovic/GoTesting/db"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func init() {
}

// @Summary      Get user info
// @Description  Retrieves information for a given user
// @Tags         user
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "User ID"
// @Success      200
// @Failure      400
// @Router       /all [get]
func handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	hello := db.GetHelloWorld()

	return events.APIGatewayProxyResponse{
		Body:       hello,
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(handler)
}
