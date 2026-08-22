import { Component, OnInit } from '@angular/core';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApolloQueryResult } from '@apollo/client/core';
import {
  CreateAnnouncementGQL,
  DeleteAnnouncementGQL,
  UpdateAnnouncementGQL,
  ViewAnnouncementQuery,
} from '../../../../../generated/graphql';
import { RouterHelperService } from '../../../../@services/router-helper.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-announcement-view',
  templateUrl: './announcement-view.component.html',
})
export class AnnouncementViewComponent implements OnInit {
  form: FormGroup;
  subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private routerHelper: RouterHelperService,
    private message: NzMessageService,
    private createGQL: CreateAnnouncementGQL,
    private updateGQL: UpdateAnnouncementGQL,
    private deleteGQL: DeleteAnnouncementGQL,
    private fb: UntypedFormBuilder,
  ) {
    this.form = this.fb.group({
      id: [null],
      userType: [[], Validators.required],
      title: [null, Validators.required],
      description: [null, Validators.required],
      url: [null],
      dates: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.subscription = this.route.data.subscribe((data) => {
      if (data.announcement == null) return;
      const announcement: ApolloQueryResult<ViewAnnouncementQuery> =
        data.announcement;
      if (announcement.data.announcement?.startAt == null) return;
      const startAt = new Date(announcement.data.announcement!.startAt);
      const expireAt = new Date(announcement.data.announcement!.expireAt);
      const dates = [startAt, expireAt];
      const userType = announcement.data.announcement.userType[0];
      this.form.patchValue({
        ...announcement.data.announcement,
        dates,
        userType,
      });
    });
  }

  async onSubmit() {
    try {
      const { id, dates, userType, ..._input } = this.form.value;
      const startAt = new Date(dates[0]).toISOString();
      const expireAt = new Date(dates[1]).toISOString();
      // userType from form is a single value, but API expects an array
      const input = { ..._input, startAt, expireAt, userType: [userType] };
      if (id == null) {
        await firstValueFrom(this.createGQL.mutate({ input }));
      } else {
        await firstValueFrom(this.updateGQL.mutate({ id, input }));
      }
      this.routerHelper.goToParent(this.route);
    } catch (error: any) {
      this.message.error(this.extractErrorMessage(error));
    }
  }

  async deleteAnnouncement() {
    try {
      const result = await firstValueFrom(
        this.deleteGQL.mutate({ id: this.form.value.id }),
      );
      this.routerHelper.goToParent(this.route);
    } catch (error: any) {
      this.message.error(this.extractErrorMessage(error));
    }
  }

  private extractErrorMessage(error: any): string {
    if (error.graphQLErrors?.length) {
      const gqlError = error.graphQLErrors[0];
      const original = gqlError.extensions?.originalError?.message;
      if (Array.isArray(original)) {
        return original.join(', ');
      } else if (typeof original === 'string') {
        return original;
      } else {
        return gqlError.message;
      }
    } else if (error.networkError) {
      return error.networkError.message || 'A network error occurred';
    }
    return error.message;
  }
}
