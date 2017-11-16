import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public readonly githubUrl = 'https://github.com/Nolanus/angular-cli-diff';

  currentVersionControl = new FormControl('', [Validators.required]);
  targetVersionControl = new FormControl('', [Validators.required, (control: AbstractControl): { [key: string]: any } => {
    return this.currentVersionControl.value.index >= control.value.index ? { 'downgradeNotPossible': true } : null;
  }]);

  public versions: string[] = [];
  constructor(httpClient: HttpClient) {
    httpClient.get('/assets/versions.json').subscribe((data: string[]) => {
      this.versions = data;
    });
  }

  ngOnInit(): void {
    this.currentVersionControl.valueChanges.subscribe(() => {
      this.targetVersionControl.updateValueAndValidity();
    });
  }

  public compare() {
    window.location.replace(this.githubUrl + '/compare/ng/' +
      this.currentVersionControl.value.version + '/app...ng/' + this.targetVersionControl.value.version + '/app#diff');
  }
}
