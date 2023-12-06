import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiUrl } from 'src/app/core/apiUrl';
import { HttpService } from 'src/app/services/http/http.service';
import { MessageService } from 'src/app/services/message/message.service'; 
import swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common'; 
import { appConfig } from 'src/app/core/app-conf';
import { LoaderService } from 'src/app/services/loader/loader.service'; 

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  appConfig = appConfig;
  status = false;
  isLoading = false;
  displayedColumns: string[] = ['id', 'eventName', 'activityDate', 'activityTime', 'performedBy', 'centreName', 'moduleName'];
  dataSource: Array<any> = [];
  searchDealer = '';
  isFullListDisplayed = false;
  pageNumber = 1;
  pageSize = 20;
  searchterm = new Subject<string>();
  loadCompleted = false;
  tableLoad = true;
  fromDelete = false;
  loadingText = false; 
  exportData: any;
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    swal.close();
  }

  constructor( 
    private http: HttpService,
    private message: MessageService,
    private toastr: ToastrService,
    private datePipe: DatePipe, 
  ) {
    this.searchterm.pipe(
      // Time in milliseconds between key events
      debounceTime(500)
      // If previous query is diffent from current
      , distinctUntilChanged()
      // subscription for response
    )
      .subscribe(term => {
        this.dataSource = [];
        this.pageNumber = 1;
        this.pageSize = 20;
        this.isFullListDisplayed = false;
        this.getAllCenters();
      });
  }

  ngOnInit(): void {
    this.getAllCenters();
  }

  dateConvert(inputDate: any) {
    return this.datePipe.transform(inputDate, 'dd-MMM-yy');
  }
  /*** Get Centers Listing ***/
  getAllCenters(): void {

    this.isLoading = true;
    const params = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchDealer
    };
    this.http.getData(ApiUrl.admin.audit, params, true).subscribe((response) => {
      if (!!response) {
        const result = response.result ? response.result : []; 
        if (result.length < this.pageSize) this.loadCompleted = true;
        result.forEach((ele: any) => {
          ele.actions = '';
        }); 
        this.dataSource = [...this.dataSource, ...result];
        this.isLoading = false; 
        if (this.dataSource.length === 0)
          this.toastr.error("No results matching the search criteria!");
        //  this.dataTableReload();
      }
    });
    this.http.getData(ApiUrl.admin.auditAll).subscribe((response: any) => {
      if (!!response) {
        const result = response.result ? response.result : [];
        const formattedDate = this.datePipe.transform(new Date(), 'ddMMMyy');
        this.exportData = result;
        if (result.length === 0)
          this.toastr.error("No results found"); 
      }

    });
  }
  dataTableReload() {
    this.tableLoad = false;
    setTimeout(() => {
      this.tableLoad = true;
    }, 100)
  }
  /*** On Search ***/
  clickEvent(): void {
    this.loadCompleted = false;
    this.status = !this.status;
    this.searchDealer = this.status ? this.searchDealer : '';
    if (!this.searchDealer) {
      this.applyFilter();
    }
  }




  /*** On Search ***/
  applyFilter(): void {
    this.searchterm.next(this.searchDealer);
  }

  /*** On Scroll load data ***/
  onScroll(): void {
    if (!this.isLoading) {
      if (((this.pageNumber * this.pageSize) <= this.dataSource.length) && !this.loadCompleted) {
        this.pageNumber++;
        this.getAllCenters();
      } else {
        this.isFullListDisplayed = true;
      }
    }
  } 
  generateExcelTable() {
    const header = [
      { name: 'ID', key: 'id', width: 100 },
      { name: 'Event Name', key: 'eventName', width: 400 },
      { name: 'Activity Date', key: 'activityDate', width: 200, dataType: 'Date' },
      { name: 'Activity Time', key: 'activityTime', width: 200 },
      { name: 'Performed By', key: 'performedBy', width: 200 },
      { name: 'Centre Name', key: 'centreName', width: 200 },
      { name: 'Module Name', key: 'moduleName', width: 200 }
    ]; 
    const formattedData = this.exportData.map((item:any) => {
      const formattedItem: any = {};
  
      header.forEach(column => {
        if (column.dataType === 'Date') {
          formattedItem[column.name] = this.datePipe.transform(item[column.key], 'dd-MMM-yy');
        } else {
          formattedItem[column.name] = item[column.key];
        }
      });
  
      return formattedItem;
    });

    let htmlTable = '<table border="1"><thead><tr>';

    // Create table header
    header.forEach((item:any) => {
      htmlTable += `<th width="${item.width}">${item.name}</th>`;
    });

    htmlTable += '</tr></thead><tbody>';

    // Create table rows
    formattedData.forEach((item:any) => { 
      htmlTable += '<tr>';
      Object.values(item).forEach(value => {
        htmlTable += `<td>${value}</td>`;
      });
      htmlTable += '</tr>';
    });

    htmlTable += '</tbody></table>';

    return htmlTable;
  }

  exportToExcelNew() {
    const excelTable = this.generateExcelTable();

    // Create a Blob object and trigger a download
    const blob = new Blob([excelTable], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const formattedDate = this.datePipe.transform(new Date(), 'ddMMMyy');
    link.download = 'PCL Log' + formattedDate+'.xls';
    link.click();
  } 
  formatDateOrTime(value: any): any {
    if (value instanceof Date) {
      return this.datePipe.transform(value, 'dd-MMM-yy');
    }
    return value;
  }  
  formatDate(date: Date): string {
    // Implement your date formatting logic here
    return '';
  }
}
