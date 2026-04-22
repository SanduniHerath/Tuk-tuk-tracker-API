//This is my API Features utility class
//The reason for created this class is I want to do filtering, sorting, field limiting and pagination
//for all my REST endpoints
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;           //this is a mongoose query object - Tuktuk.find()
    this.queryString = queryString; //this is the raw quesry from the URL - req.query
  }

  //in here, I setup filtering mechanism
  filter() {
    //make a copy of the query sting so its not modified the original query
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    //in here I removed all the other mechanisms like sort, pagination, field limiting
    //so that I can use the remaining query string for filtering
    excludedFields.forEach(el => delete queryObj[el]);

    //in here I setup advanced filtering for operators like gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  //in here I setup sorting mechanism
  //by using sort(), I can handle ?sort=createdAt or ?sort=-createdAt (descending)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      //default sorting method set to show the newest records first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  //in here, I setup the field limiting mechanism
  //by using select(), I can handle ?fields=name,NIC to reduce data usage
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //due to the security reasons, I always hide the __v field from the user
      this.query = this.query.select('-__v');
    }
    return this;
  }

  //in here, I handle pagination mechanism
  //by using this pagination technique, I can handle ?page=2&limit=10 to split results into pages
  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

export default ApiFeatures;
