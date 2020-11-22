export interface ICrudResponse {
    data: any[];
    count: number;
    total: number;
    page: number;
    pageCount: number;
}

export class CrudResponse implements ICrudResponse {
    data: any[];

    count: number;

    total: number;

    page: number;

    pageCount: number;

    constructor() {
    }

    get() {
        return this;
    }

    setData(data: any[]) {
        this.data = data;
    }

    setCount(count: number) {
        this.count = count;
    }

    setTotal(total: number) {
        this.total = total;
    }

    setPage(page: number) {
        this.page = page;
    }

    setPageCount(pageCount: number) {
        this.pageCount = pageCount;
    }
}
