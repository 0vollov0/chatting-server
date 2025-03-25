import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@common/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import mongoose, { Model } from 'mongoose';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<User>;

  // Mock user data
  const mockUser = {
    _id: new mongoose.Types.ObjectId().toHexString(),
    name: 'testUser',
    password: bcrypt.hashSync('password123', 10),
  };

  // Mock user model with necessary methods
  const mockUserModel = {
    create: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  describe('create()', () => {
    it('✅ Should create a new user with a hashed password', async () => {
      const dto = { name: 'testUser', password: 'password123' };
      const result = await service.create(dto);

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: dto.name }),
      );
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('password');
      expect(bcrypt.compareSync(dto.password, result.password)).toBeTruthy();
    });
  });

  describe('validate()', () => {
    it('✅ Should return user if credentials are valid', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      const result = await service.validate(mockUser.name, 'password123');

      expect(userModel.findOne).toHaveBeenCalledWith({ name: mockUser.name });
      expect(result).toEqual(mockUser);
    });

    it('✅ Should return null if password is incorrect', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      const result = await service.validate(mockUser.name, 'wrongpassword');

      expect(userModel.findOne).toHaveBeenCalledWith({ name: mockUser.name });
      expect(result).toBeNull();
    });

    it('✅ Should return null if user does not exist', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.validate('nonexistentUser', 'password123');

      expect(userModel.findOne).toHaveBeenCalledWith({
        name: 'nonexistentUser',
      });
      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('✅ Should return user if valid ID is provided', async () => {
      const result = await service.findById(mockUser._id);

      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });

    it('✅ Should return null if user does not exist', async () => {
      userModel.findById = jest.fn().mockResolvedValue(null);

      const result = await service.findById(
        new mongoose.Types.ObjectId().toHexString(),
      );

      expect(result).toBeNull();
    });
  });

  describe('find()', () => {
    it('✅ Should return a list of users for given IDs', async () => {
      const userIds = [
        mockUser._id,
        new mongoose.Types.ObjectId().toHexString(),
      ];
      const result = await service.find(userIds);

      expect(userModel.find).toHaveBeenCalledWith({
        _id: { $in: expect.any(Array) },
      });
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('✅ Should return an empty array if no users are found', async () => {
      userModel.find = jest.fn().mockResolvedValue([]);

      const userIds = [new mongoose.Types.ObjectId().toHexString()];
      const result = await service.find(userIds);

      expect(result).toEqual([]);
    });
  });
});
