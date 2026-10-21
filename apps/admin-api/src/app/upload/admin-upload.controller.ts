import { Controller, Post, Req, Res, UploadedFile, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DriverEntity,
  DriverToDriverDocumentEntity,
  MediaEntity,
  UploadImageInterceptor,
} from '@ridy/database';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import urlJoin from 'proper-url-join';
import { RestJwtAuthGuard } from '../auth/rest-jwt-auth.guard';

@Controller()
export class AdminUploadController {
  constructor(
    @InjectRepository(MediaEntity)
    private mediaRepository: Repository<MediaEntity>,
    @InjectRepository(DriverEntity)
    private driverRepository: Repository<DriverEntity>,
    @InjectRepository(DriverToDriverDocumentEntity)
    private driverDocumentRepository: Repository<DriverToDriverDocumentEntity>,
  ) {}

  @Post('admin_upload_media')
  @UseGuards(RestJwtAuthGuard)
  @UploadImageInterceptor('file')
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const insert = await this.mediaRepository.save({ address: file.filename });
    const driverId = parseInt(req.body?.driverId);
    const docRowId = parseInt(req.body?.driverDocumentRowId);
    if (!isNaN(docRowId)) {
      await this.driverDocumentRepository.update(docRowId, { mediaId: insert.id });
    } else if (!isNaN(driverId)) {
      await this.driverRepository.update(driverId, { mediaId: insert.id });
    }
    res.send({
      id: insert.id.toString(),
      address: urlJoin(process.env.CDN_URL, file.filename),
    });
  }
}
