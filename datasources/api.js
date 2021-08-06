const { RESTDataSource } = require("apollo-datasource-rest");

class APIService extends RESTDataSource {

    constructor() {
        super();
        this.baseURL = "https://randomuser.me/api/";
    }

    async getPerson() {
        const { results } = await this.get("");
        return results;
    }

}

module.exports = APIService;