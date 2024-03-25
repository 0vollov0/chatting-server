import { Pagination } from './type';

interface PaginationMock<T> extends Pagination {
  docs: Array<T>;
}

export const paginationMock: PaginationMock<any> = {
  docs: [],
  totalDocs: 0,
  limit: 1,
  totalPages: 0,
  page: 1,
  pagingCounter: 0,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
};
