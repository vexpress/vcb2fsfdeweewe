import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiUrl } from 'src/app/core/apiUrl';
import { HttpService } from 'src/app/services/http/http.service';
import { MessageService } from 'src/app/services/message/message.service';
import { UserService } from 'src/app/services/user/user.service';
import { Patterns } from 'src/app/shared/models/patterns.model';


@Component({
  selector: 'app-pcl-authorization',
  templateUrl: './pcl-authorization.component.html',
  styleUrls: ['./pcl-authorization.component.scss']
})
export class PclAuthorizationComponent implements OnInit {

  isSubmitted = false;
  isLoading = false;
  isAdmin = false;
  validationPattern = new Patterns();
  requestData: any;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private user: UserService,
    private message: MessageService,
    private http: HttpService
  ) {
  }

  ngOnInit(): void {
    
    this.http.getData('auth/getppnuserinfo').subscribe(
      (response: any) => {
        console.log(response);
        if (!!response) {
          this.requestData = response.result ? response.result : {};
          this.onSubmit();
        }
      },

      (err) => {
        
        //this.router.navigate(['pcl-auth']);
		this.message.toast('error', err.message);
        // Handle error 
      }
    );
  }

  /*** Intialize Login Form ***/
  createLoginForm(): void {
  }

  clearAllCookies() {
    const cookies = document.cookie.split('; ');
    console.log("cookies", cookies);
    for (const cookie of cookies) {
      const [name, _] = cookie.split('=');
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }


  /*** Submit Login Form ***/
  onSubmit(): void {
    const submitData = {
      email: this.requestData.email,
      firstName: this.requestData.name,
      lastName: this.requestData.given_name,
      phone: this.requestData.phone ? this.requestData.phone : '',
      centreName: this.requestData.centrename,
      roleName: this.requestData.app_roles,
    }
    this.isSubmitted = true;
    const params = { ...submitData };
    this.isLoading = true;
    const url = ApiUrl.auth.pclLogin;
    this.http.postData(url, params).subscribe((response) => {
      this.isLoading = false;
      if (!!response) {

        const result = response.result ? response.result : {};

        if (result) {
          this.user.setUserLocalData(response.result);
          this.message.toast('success', response.message);
          if (response.result.roleInfo.roleGroup === 'Admin') {
            this.router.navigate(['admin/all-dealers']);
          }
          else {
            this.router.navigate(['']);
          }
        }
        else {
          this.message.toast('error', response.message);          
        }
      }
    }, (err) => {
      this.isLoading = false;
    });
  }

  /*** Navigate to forgot password page ***/
  forgotPassword(): void {
    if (this.isAdmin) {
      this.router.navigate(['admin/forgot-password']);
    } else {
      this.router.navigate(['/forgot-password']);
    }
  }

}
