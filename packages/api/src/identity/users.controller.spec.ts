import { UsersController } from './users.controller';
import { UsersService, UserListItem, CreateUserDto } from './users.service';
import { Role } from '@lol/shared';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<UsersService>;

  const mockUsers: UserListItem[] = [
    {
      id: 'u1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.Admin,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'u2',
      email: 'dispatcher@test.com',
      firstName: 'Alex',
      lastName: 'Petrov',
      role: Role.Dispatcher,
      createdAt: '2026-02-01T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    usersService = {
      listAll: jest.fn().mockResolvedValue(mockUsers),
      createUser: jest.fn().mockResolvedValue(mockUsers[1]),
    };

    controller = new UsersController(usersService as UsersService);
  });

  describe('list', () => {
    it('should return all users from service', async () => {
      const result = await controller.list();

      expect(usersService.listAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('should create a user via service', async () => {
      const dto: CreateUserDto = {
        email: 'new@test.com',
        firstName: 'Alex',
        lastName: 'Petrov',
        password: 'secret123',
        role: Role.Dispatcher,
      };

      const result = await controller.create(dto);

      expect(usersService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUsers[1]);
    });
  });
});
