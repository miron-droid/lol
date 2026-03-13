import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService, CreateUserDto } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '@lol/shared';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repo: Partial<Repository<User>>;

  const mockUsers: Partial<User>[] = [
    {
      id: 'u1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.Admin,
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
    {
      id: 'u2',
      email: 'dispatcher@test.com',
      firstName: 'Alex',
      lastName: 'Petrov',
      role: Role.Dispatcher,
      createdAt: new Date('2026-02-01T10:00:00Z'),
    },
    {
      id: 'u3',
      email: 'accountant@test.com',
      firstName: 'Sarah',
      lastName: 'Miller',
      role: Role.Accountant,
      createdAt: new Date('2026-02-10T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue(mockUsers),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => ({
        ...data,
        id: 'new-id',
        createdAt: new Date('2026-03-01T10:00:00Z'),
      })),
    };

    service = new UsersService(repo as Repository<User>);
  });

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUsers[0]);

      const result = await service.findByEmail('ADMIN@TEST.COM');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      });
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null when user not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUsers[0]);

      const result = await service.findById('u1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual(mockUsers[0]);
    });
  });

  describe('listAll', () => {
    it('should return all users sorted by createdAt', async () => {
      const result = await service.listAll();

      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'u1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.Admin,
        createdAt: '2026-01-15T10:00:00.000Z',
      });
    });

    it('should map all fields correctly', async () => {
      const result = await service.listAll();

      expect(result[1]).toEqual({
        id: 'u2',
        email: 'dispatcher@test.com',
        firstName: 'Alex',
        lastName: 'Petrov',
        role: Role.Dispatcher,
        createdAt: '2026-02-01T10:00:00.000Z',
      });
    });
  });

  describe('createUser', () => {
    const dto: CreateUserDto = {
      email: 'new@test.com',
      firstName: 'New',
      lastName: 'User',
      password: 'secret123',
      role: Role.Dispatcher,
    };

    it('should create a new user with hashed password', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null); // no existing

      const result = await service.createUser(dto);

      expect(repo.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        passwordHash: 'hashed_password',
        role: Role.Dispatcher,
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
      expect(result.email).toBe('new@test.com');
      expect(result.firstName).toBe('New');
      expect(result.role).toBe(Role.Dispatcher);
    });

    it('should lowercase email before saving', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await service.createUser({ ...dto, email: 'NEW@TEST.COM' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.com' }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUsers[0]); // existing user

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
