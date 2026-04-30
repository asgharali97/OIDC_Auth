class ApiResponse {
    static ok(res, message, data = null) {
        return res.status(200).json(
            {
                sucess: true,
                message,
                data
            }
        )
    }

    static created(res, message, data = null) {
        return res.status(201).json(
            {
                sucess: true,
                message,
                data
            }
        )
    }

    static noContent(res) {
        return res.status(204).send()
    }

    static badRequest(res) {
        return res.status(400).json(
            {
                sucess: false,
                message: "Bad request"
            }
        )
    }

}

export default ApiResponse