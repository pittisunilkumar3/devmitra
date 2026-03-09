import { Request, Response } from 'express';
import DeveloperModel from '../models/Developer';
import UserModel from '../models/User';
import type { ApiResponse, PaginatedResponse, Developer, CreateDeveloperInput } from '../types';

interface DeveloperWithUser extends Developer {
  user_name: string;
  user_email: string;
  profile_image: string | null;
}

export class DeveloperController {
  // GET /api/developers
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | null;

      const offset = (page - 1) * limit;
      let developers: DeveloperWithUser[];
      let total: number;

      if (status) {
        developers = await DeveloperModel.findByStatus(status, limit, offset);
        total = await DeveloperModel.count(status);
      } else {
        developers = await DeveloperModel.findAll(limit, offset);
        total = await DeveloperModel.count();
      }

      const response: PaginatedResponse<DeveloperWithUser> = {
        success: true,
        data: developers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get developers error:', error);
      res.status(500).json({ success: false, error: 'Failed to get developers' });
    }
  }

  // GET /api/developers/browse (for users)
  static async browse(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const minRate = req.query.minRate ? parseFloat(req.query.minRate as string) : undefined;
      const maxRate = req.query.maxRate ? parseFloat(req.query.maxRate as string) : undefined;
      const skills = req.query.skills ? (req.query.skills as string).split(',') : undefined;
      const availability = req.query.availability === 'true' ? true : undefined;

      const offset = (page - 1) * limit;

      const developers = await DeveloperModel.findApproved(limit, offset, {
        skills,
        minRate,
        maxRate,
        availability,
      });

      const total = await DeveloperModel.count('approved');

      const response: PaginatedResponse<DeveloperWithUser> = {
        success: true,
        data: developers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Browse developers error:', error);
      res.status(500).json({ success: false, error: 'Failed to browse developers' });
    }
  }

  // GET /api/developers/me (get authenticated developer's profile)
  static async getMine(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      if (currentUser.role !== 'developer') {
        res.status(403).json({ success: false, error: 'Only developers can access this endpoint' });
        return;
      }

      const developer = await DeveloperModel.findByUserId(currentUser.id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer profile not found' });
        return;
      }

      // Get user info
      const user = await UserModel.findById(currentUser.id);

      const developerWithUser: DeveloperWithUser = {
        ...developer,
        user_name: user?.name || '',
        user_email: user?.email || '',
        profile_image: user?.profile_image || null,
      };

      res.json({ success: true, data: developerWithUser });
    } catch (error) {
      console.error('Get my developer profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get developer profile' });
    }
  }

  // GET /api/developers/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const developer = await DeveloperModel.findById(id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      // Get user info
      const user = await UserModel.findById(developer.user_id);

      const developerWithUser: DeveloperWithUser = {
        ...developer,
        user_name: user?.name || '',
        user_email: user?.email || '',
        profile_image: user?.profile_image || null,
      };

      res.json({ success: true, data: developerWithUser });
    } catch (error) {
      console.error('Get developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to get developer' });
    }
  }

  // POST /api/developers (create/update onboarding)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      if (currentUser.role !== 'developer') {
        res.status(403).json({ success: false, error: 'Only developers can create developer profiles' });
        return;
      }

      const body = req.body;

      // Check if developer profile already exists
      const existing = await DeveloperModel.findByUserId(currentUser.id);

      if (existing) {
        // Update existing profile
        await DeveloperModel.update(existing.id, {
          skills: body.skills,
          experience: body.experience,
          hourly_rate: body.hourlyRate,
          availability: body.availability,
          bio: body.bio,
          phone: body.phone,
          country: body.country,
          timezone: body.timezone,
          job_title: body.jobTitle,
          weekly_hours: body.weeklyHours,
          github_url: body.githubUrl,
          linkedin_url: body.linkedinUrl,
          other_urls: body.otherUrls,
          portfolio: body.portfolioUrl,
        });

        res.json({ success: true, message: 'Developer profile updated successfully' });
        return;
      }

      // Create new profile
      const input: CreateDeveloperInput = {
        user_id: currentUser.id,
        skills: body.skills,
        experience: body.experience,
        hourly_rate: body.hourlyRate,
        availability: body.availability,
        bio: body.bio,
        phone: body.phone,
        country: body.country,
        timezone: body.timezone,
        job_title: body.jobTitle,
        weekly_hours: body.weeklyHours,
        github_url: body.githubUrl,
        linkedin_url: body.linkedinUrl,
        other_urls: body.otherUrls,
        portfolio: body.portfolioUrl,
      };

      await DeveloperModel.create(input);

      res.status(201).json({ success: true, message: 'Developer profile created successfully' });
    } catch (error) {
      console.error('Create developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to create developer profile' });
    }
  }

  // PUT /api/developers/:id
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;
      const developer = await DeveloperModel.findById(id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      // Only admin or the developer themselves can update
      if (currentUser.role !== 'superadmin' && developer.user_id !== currentUser.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      const body = req.body;

      await DeveloperModel.update(id, {
        skills: body.skills,
        experience: body.experience,
        hourly_rate: body.hourlyRate,
        availability: body.availability,
        bio: body.bio,
        phone: body.phone,
        country: body.country,
        timezone: body.timezone,
        job_title: body.jobTitle,
        weekly_hours: body.weeklyHours,
        github_url: body.githubUrl,
        linkedin_url: body.linkedinUrl,
        other_urls: body.otherUrls,
        portfolio: body.portfolioUrl,
      });

      res.json({ success: true, message: 'Developer updated successfully' });
    } catch (error) {
      console.error('Update developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to update developer' });
    }
  }

  // PUT /api/developers/:id/approve
  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;
      const developer = await DeveloperModel.findById(id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      await DeveloperModel.approve(id, currentUser.id);

      res.json({ success: true, message: 'Developer approved successfully' });
    } catch (error) {
      console.error('Approve developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to approve developer' });
    }
  }

  // PUT /api/developers/:id/reject
  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, error: 'Rejection reason is required' });
        return;
      }

      const developer = await DeveloperModel.findById(id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      await DeveloperModel.reject(id, reason);

      res.json({ success: true, message: 'Developer rejected' });
    } catch (error) {
      console.error('Reject developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to reject developer' });
    }
  }

  // DELETE /api/developers/:id
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const developer = await DeveloperModel.findById(id);

      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      await DeveloperModel.delete(id);

      res.json({ success: true, message: 'Developer deleted successfully' });
    } catch (error) {
      console.error('Delete developer error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete developer' });
    }
  }

  // GET /api/developers/stats
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await DeveloperModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get developer stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  }
}

export default DeveloperController;
