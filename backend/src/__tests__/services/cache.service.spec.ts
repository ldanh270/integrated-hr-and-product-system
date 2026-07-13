/// <reference types="jest" />
import Redis from 'ioredis';
import { InMemoryCacheService, RedisCacheService, createCacheService } from '../../services/cache.service';

let mockRedisInstances: any[] = [];
let mockRedisConnectShouldFail: boolean = false;
let mockRedisSubscribeShouldFail: boolean = false;

jest.mock('ioredis', () => {
  const EventEmitter = require('events');
  class MockRedis extends EventEmitter {
    public connectionString: string;
    public options: any;
    public get: jest.Mock;
    public set: jest.Mock;
    public del: jest.Mock;
    public flushdb: jest.Mock;
    public subscribe: jest.Mock;
    public publish: jest.Mock;

    constructor(connectionString: string, options?: any) {
      super();
      this.connectionString = connectionString;
      this.options = options;
      
      this.get = jest.fn().mockResolvedValue(null);
      this.set = jest.fn().mockResolvedValue('OK');
      this.del = jest.fn().mockResolvedValue(1);
      this.flushdb = jest.fn().mockResolvedValue('OK');
      this.subscribe = jest.fn().mockImplementation(() => 
        mockRedisSubscribeShouldFail ? Promise.reject(new Error('Sub failed')) : Promise.resolve(null)
      );
      this.publish = jest.fn().mockResolvedValue(1);

      mockRedisInstances.push(this);
      
      process.nextTick(() => {
        if (mockRedisConnectShouldFail) {
          this.emit('error', new Error('Connection failed'));
        } else {
          this.emit('connect');
        }
      });
    }
  }

  return MockRedis;
});

describe('InMemoryCacheService.get', () => {
  it('UTCID01 - should return the cached value when it exists and is not expired (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    await service.set('test-key', 'test-value');

    // Act
    const result = await service.get('test-key');

    // Assert
    expect(result).toBe('test-value');
  });

  it('UTCID02 - should return null when the key does not exist (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act
    const result = await service.get('non-existent');

    // Assert
    expect(result).toBeNull();
  });

  it('UTCID03 - should return null and delete the key when the key is expired (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
    await service.set('temp-key', 'temp-value', 5);
    dateSpy.mockReturnValue(1000000006000);

    // Act
    const result = await service.get('temp-key');
    dateSpy.mockRestore();

    // Assert
    expect(result).toBeNull();
  });
});

describe('InMemoryCacheService.set', () => {
  it('UTCID01 - should store the value in cache successfully (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act
    await service.set('key1', 'val1');
    const result = await service.get('key1');

    // Assert
    expect(result).toBe('val1');
  });

  it('UTCID02 - should set the correct expiration time when TTL is provided (Alternative Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);

    // Act
    await service.set('key2', 'val2', 10);
    dateSpy.mockRestore();

    const laterSpy = jest.spyOn(Date, 'now').mockReturnValue(12000);
    const result = await service.get('key2');
    laterSpy.mockRestore();

    // Assert
    expect(result).toBeNull();
  });

  it('UTCID03 - should throw error when internal storage fails (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const setSpy = jest.spyOn(Map.prototype, 'set').mockImplementationOnce(() => {
      throw new Error('Internal Map Error');
    });

    // Act & Assert
    await expect(service.set('key3', 'val3')).rejects.toThrow('Internal Map Error');
    setSpy.mockRestore();
  });
});

describe('InMemoryCacheService.del', () => {
  it('UTCID01 - should delete the specified key (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    await service.set('key', 'val');

    // Act
    await service.del('key');
    const result = await service.get('key');

    // Assert
    expect(result).toBeNull();
  });

  it('UTCID02 - should not throw if deleting a non-existent key (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act & Assert
    await expect(service.del('non-existent')).resolves.not.toThrow();
  });

  it('UTCID03 - should throw when delete method fails internally (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const deleteSpy = jest.spyOn(Map.prototype, 'delete').mockImplementationOnce(() => {
      throw new Error('Delete Error');
    });

    // Act & Assert
    await expect(service.del('key')).rejects.toThrow('Delete Error');
    deleteSpy.mockRestore();
  });
});

describe('InMemoryCacheService.clear', () => {
  it('UTCID01 - should clear all entries in the cache (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    await service.set('key1', 'val1');
    await service.set('key2', 'val2');

    // Act
    await service.clear();
    const r1 = await service.get('key1');
    const r2 = await service.get('key2');

    // Assert
    expect(r1).toBeNull();
    expect(r2).toBeNull();
  });

  it('UTCID02 - should not throw when clearing an already empty cache (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act & Assert
    await expect(service.clear()).resolves.not.toThrow();
  });

  it('UTCID03 - should throw when clear method fails internally (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const clearSpy = jest.spyOn(Map.prototype, 'clear').mockImplementationOnce(() => {
      throw new Error('Clear Error');
    });

    // Act & Assert
    await expect(service.clear()).rejects.toThrow('Clear Error');
    clearSpy.mockRestore();
  });
});

describe('InMemoryCacheService.subscribe', () => {
  it('UTCID01 - should register a subscriber and receive updates (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const callback = jest.fn();

    // Act
    await service.subscribe('channel1', callback);
    await service.publish('channel1', 'hello');

    // Assert
    expect(callback).toHaveBeenCalledWith('hello');
  });

  it('UTCID02 - should not invoke callback if published on a different channel (Error/Alternative Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const callback = jest.fn();

    // Act
    await service.subscribe('channel1', callback);
    await service.publish('channel2', 'hello');

    // Assert
    expect(callback).not.toHaveBeenCalled();
  });

  it('UTCID03 - should throw error if the subscriber callback is invalid (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act & Assert
    await expect(service.subscribe('channel3', null as any)).rejects.toThrow();
  });
});

describe('InMemoryCacheService.publish', () => {
  it('UTCID01 - should publish a message to active subscribers (Happy Path)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const callback = jest.fn();
    await service.subscribe('test-channel', callback);

    // Act
    await service.publish('test-channel', 'msg');

    // Assert
    expect(callback).toHaveBeenCalledWith('msg');
  });

  it('UTCID02 - should complete successfully if there are no subscribers (Error/Alternative Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();

    // Act & Assert
    await expect(service.publish('empty-channel', 'msg')).resolves.not.toThrow();
  });

  it('UTCID03 - should throw error if publish fails internally (Error Case)', async () => {
    // Arrange
    const service = new InMemoryCacheService();
    const emitSpy = jest.spyOn((service as any)['emitter'], 'emit').mockImplementationOnce(() => {
      throw new Error('Emit failed');
    });

    // Act & Assert
    await expect(service.publish('channel', 'msg')).rejects.toThrow('Emit failed');
    emitSpy.mockRestore();
  });
});

describe('RedisCacheService.constructor', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(() => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
  });

  it('UTCID01 - should initialize Redis successfully when connection is stable (Happy Path)', async () => {
    // Arrange
    mockRedisConnectShouldFail = false;

    // Act
    const service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));

    // Assert
    expect((service as any)['isRedisAvailable']).toBe(true);
  });

  it('UTCID02 - should fall back to in-memory if Redis connection fails (Error Case)', async () => {
    // Arrange
    mockRedisConnectShouldFail = true;

    // Act
    const service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));

    // Assert
    expect((service as any)['isRedisAvailable']).toBe(false);
  });

  it('UTCID03 - should fall back to in-memory if Redis instantiation throws an error (Error Case)', async () => {
    // Arrange
    const spy = jest.spyOn(Redis.prototype, 'on').mockImplementationOnce(() => {
      throw new Error('Instantiate error');
    });

    // Act
    const service = new RedisCacheService('redis://localhost:6379');

    // Assert
    expect((service as any)['isRedisAvailable']).toBe(false);
    spy.mockRestore();
  });
});

describe('RedisCacheService.get', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should return parsed JSON from Redis when key exists (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.get.mockResolvedValue(JSON.stringify({ data: 'hello' }));

    // Act
    const result = await service.get('my-key');

    // Assert
    expect(result).toEqual({ data: 'hello' });
    expect(client.get).toHaveBeenCalledWith('my-key');
  });

  it('UTCID02 - should return value from local cache if Redis is unavailable (Error/Fallback Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    await (service as any)['fallbackMemory'].set('fallback-key', 'local-value');

    // Act
    const result = await service.get('fallback-key');

    // Assert
    expect(result).toBe('local-value');
  });

  it('UTCID03 - should return value from local cache and log warning if Redis get throws error (Error/Fallback Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.get.mockRejectedValue(new Error('Redis Timeout'));
    await (service as any)['fallbackMemory'].set('fallback-key', 'local-value');

    // Act
    const result = await service.get('fallback-key');

    // Assert
    expect(result).toBe('local-value');
  });

  it('UTCID04 - should delete key and return null if JSON parse fails (Error Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.get.mockResolvedValue('invalid-json{');
    const delSpy = jest.spyOn(service, 'del').mockResolvedValue(undefined);

    // Act
    const result = await service.get('corrupted-key');

    // Assert
    expect(result).toBeNull();
    expect(delSpy).toHaveBeenCalledWith('corrupted-key');
    delSpy.mockRestore();
  });
});

describe('RedisCacheService.set', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should set value in both Redis and fallback memory with TTL (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    
    // Act
    await service.set('test-key', { data: 123 }, 60);

    // Assert
    expect(client.set).toHaveBeenCalledWith('test-key', JSON.stringify({ data: 123 }), 'EX', 60);
    const localVal = await (service as any)['fallbackMemory'].get('test-key');
    expect(localVal).toEqual({ data: 123 });
  });

  it('UTCID02 - should set value without TTL in Redis if no TTL is provided (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    
    // Act
    await service.set('test-key-no-ttl', { data: 456 });

    // Assert
    expect(client.set).toHaveBeenCalledWith('test-key-no-ttl', JSON.stringify({ data: 456 }));
  });

  it('UTCID03 - should update fallback memory even if Redis is unavailable (Error Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    const client = mockRedisInstances[0];

    // Act
    await service.set('local-only', 'val');

    // Assert
    expect(client.set).not.toHaveBeenCalled();
    const localVal = await (service as any)['fallbackMemory'].get('local-only');
    expect(localVal).toBe('val');
  });

  it('UTCID04 - should catch and log error if client.set throws (Error Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.set.mockRejectedValue(new Error('Redis SET Failed'));

    // Act & Assert
    await expect(service.set('error-key', 'val')).resolves.not.toThrow();
  });
});

describe('RedisCacheService.del', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should delete key from both Redis and fallback memory (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    await (service as any)['fallbackMemory'].set('key', 'val');

    // Act
    await service.del('key');

    // Assert
    expect(client.del).toHaveBeenCalledWith('key');
    const localVal = await (service as any)['fallbackMemory'].get('key');
    expect(localVal).toBeNull();
  });

  it('UTCID02 - should delete key from fallback memory even if Redis is unavailable (Error Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    const client = mockRedisInstances[0];
    await (service as any)['fallbackMemory'].set('key', 'val');

    // Act
    await service.del('key');

    // Assert
    expect(client.del).not.toHaveBeenCalled();
    const localVal = await (service as any)['fallbackMemory'].get('key');
    expect(localVal).toBeNull();
  });

  it('UTCID03 - should log warning if client.del throws an error (Error Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.del.mockRejectedValue(new Error('Redis DEL Failed'));

    // Act & Assert
    await expect(service.del('key')).resolves.not.toThrow();
  });
});

describe('RedisCacheService.clear', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should clear fallback memory and call flushdb on Redis (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    await (service as any)['fallbackMemory'].set('key', 'val');

    // Act
    await service.clear();

    // Assert
    expect(client.flushdb).toHaveBeenCalled();
    const localVal = await (service as any)['fallbackMemory'].get('key');
    expect(localVal).toBeNull();
  });

  it('UTCID02 - should clear fallback memory even if Redis is unavailable (Error Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    const client = mockRedisInstances[0];
    await (service as any)['fallbackMemory'].set('key', 'val');

    // Act
    await service.clear();

    // Assert
    expect(client.flushdb).not.toHaveBeenCalled();
    const localVal = await (service as any)['fallbackMemory'].get('key');
    expect(localVal).toBeNull();
  });

  it('UTCID03 - should log warning if client.flushdb throws (Error Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.flushdb.mockRejectedValue(new Error('Flush failed'));

    // Act & Assert
    await expect(service.clear()).resolves.not.toThrow();
  });
});

describe('RedisCacheService.subscribe', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should subscribe to Redis channel and trigger callback when message arrives (Happy Path)', async () => {
    // Arrange
    const callback = jest.fn();

    // Act
    await service.subscribe('channel-1', callback);
    
    const subClient = mockRedisInstances.find(inst => inst !== mockRedisInstances[0]);
    expect(subClient).toBeDefined();
    expect(subClient.subscribe).toHaveBeenCalledWith('channel-1');

    subClient.emit('message', 'channel-1', 'hello-world');

    // Assert
    expect(callback).toHaveBeenCalledWith('hello-world');
  });

  it('UTCID02 - should subscribe only to fallback memory if Redis is unavailable (Error/Fallback Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    const callback = jest.fn();

    // Act
    await service.subscribe('channel-2', callback);
    await service.publish('channel-2', 'mem-msg');

    // Assert
    expect(callback).toHaveBeenCalledWith('mem-msg');
  });

  it('UTCID03 - should handle errors and log warnings if Redis subscription fails (Error Case)', async () => {
    // Arrange
    mockRedisSubscribeShouldFail = true;
    
    // Act & Assert
    await expect(service.subscribe('channel-3', () => {})).resolves.not.toThrow();
  });
});

describe('RedisCacheService.publish', () => {
  let service: RedisCacheService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    mockRedisInstances = [];
    mockRedisConnectShouldFail = false;
    mockRedisSubscribeShouldFail = false;
    service = new RedisCacheService('redis://localhost:6379');
    await new Promise((resolve) => process.nextTick(resolve));
  });

  it('UTCID01 - should publish message to both Redis and fallback memory (Happy Path)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    const localCallback = jest.fn();
    await (service as any)['fallbackMemory'].subscribe('pub-chan', localCallback);

    // Act
    await service.publish('pub-chan', 'hello');

    // Assert
    expect(client.publish).toHaveBeenCalledWith('pub-chan', 'hello');
    expect(localCallback).toHaveBeenCalledWith('hello');
  });

  it('UTCID02 - should only publish to fallback memory if Redis is unavailable (Error/Fallback Case)', async () => {
    // Arrange
    (service as any)['isRedisAvailable'] = false;
    const client = mockRedisInstances[0];
    const localCallback = jest.fn();
    await (service as any)['fallbackMemory'].subscribe('pub-chan-2', localCallback);

    // Act
    await service.publish('pub-chan-2', 'hello-local');

    // Assert
    expect(client.publish).not.toHaveBeenCalled();
    expect(localCallback).toHaveBeenCalledWith('hello-local');
  });

  it('UTCID03 - should catch error and log warning if client.publish throws (Error Case)', async () => {
    // Arrange
    const client = mockRedisInstances[0];
    client.publish.mockRejectedValue(new Error('Publish failed'));

    // Act & Assert
    await expect(service.publish('pub-chan-3', 'val')).resolves.not.toThrow();
  });
});

describe('createCacheService', () => {
  const originalEnv = process.env;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  it('UTCID01 - should return RedisCacheService when REDIS_URL is provided (Happy Path)', async () => {
    // Arrange
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Act
    const service = createCacheService();
    await new Promise((resolve) => process.nextTick(resolve));

    // Assert
    expect(service).toBeInstanceOf(RedisCacheService);
  });

  it('UTCID02 - should return InMemoryCacheService when REDIS_URL is not set (Error/Fallback Case)', async () => {
    // Arrange
    delete process.env.REDIS_URL;

    // Act
    const service = createCacheService();
    await new Promise((resolve) => process.nextTick(resolve));

    // Assert
    expect(service).toBeInstanceOf(InMemoryCacheService);
  });

  it('UTCID03 - should return InMemoryCacheService when REDIS_URL is empty (Error/Fallback Case)', async () => {
    // Arrange
    process.env.REDIS_URL = '';

    // Act
    const service = createCacheService();
    await new Promise((resolve) => process.nextTick(resolve));

    // Assert
    expect(service).toBeInstanceOf(InMemoryCacheService);
  });
});