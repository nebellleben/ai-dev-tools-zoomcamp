const request = require('supertest');
const { io: ioClient } = require('socket.io-client');
const { app, server, io, rooms } = require('../server');

describe('Integration Tests - Client-Server Interaction', () => {
  let httpServer;
  const TEST_PORT = 3002;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  beforeAll((done) => {
    // Start server on test port
    httpServer = server.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      done();
    });
  });

  afterAll((done) => {
    // Clean up: clear all timeouts and close connections
    rooms.forEach((room) => {
      if (room._cleanupTimeout) {
        clearTimeout(room._cleanupTimeout);
      }
    });
    // Close all socket connections and server
    io.close();
    httpServer.close(() => {
      // Give a moment for cleanup
      setTimeout(done, 100);
    });
  });

  beforeEach(() => {
    // Clear rooms before each test
    rooms.clear();
  });

  describe('REST API Endpoints', () => {
    describe('POST /api/rooms', () => {
      it('should create a new room with auto-generated ID', async () => {
        const response = await request(app)
          .post('/api/rooms');

        if (response.status !== 201) {
          console.error('Error response:', response.status, response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('roomId');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('userCount', 0);
        expect(response.body).toHaveProperty('code', '');
        expect(response.body).toHaveProperty('language', 'javascript');
        expect(typeof response.body.roomId).toBe('string');
        expect(response.body.roomId.length).toBeGreaterThan(0);
      });

      it('should create a room with provided roomId', async () => {
        const customRoomId = 'test-room-123';
        const response = await request(app)
          .post('/api/rooms')
          .send({ roomId: customRoomId })
          .expect(201);

        expect(response.body.roomId).toBe(customRoomId);
        expect(rooms.has(customRoomId)).toBe(true);
      });
    });

    describe('GET /api/rooms/:roomId', () => {
      it('should return room information for existing room', async () => {
        const roomId = 'test-room-456';
        rooms.set(roomId, {
          roomId,
          createdAt: new Date().toISOString(),
          userCount: 2,
          code: 'console.log("test");',
          language: 'javascript',
        });

        const response = await request(app)
          .get(`/api/rooms/${roomId}`)
          .expect(200);

        expect(response.body.roomId).toBe(roomId);
        expect(response.body.userCount).toBe(2);
        expect(response.body.code).toBe('console.log("test");');
      });

      it('should return 404 for non-existent room', async () => {
        const response = await request(app)
          .get('/api/rooms/non-existent-room')
          .expect(404);

        expect(response.body).toHaveProperty('message', 'Room not found');
        expect(response.body).toHaveProperty('code', 'ROOM_NOT_FOUND');
      });
    });
  });

  describe('WebSocket Events', () => {
    let client1, client2;
    const testRoomId = 'ws-test-room';

    beforeEach((done) => {
      // Create two clients for testing
      client1 = ioClient(BASE_URL, {
        transports: ['websocket'],
        forceNew: true,
      });

      client2 = ioClient(BASE_URL, {
        transports: ['websocket'],
        forceNew: true,
      });

      // Wait for both clients to connect
      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) {
          done();
        }
      };

      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
    });

    afterEach((done) => {
      // Disconnect clients
      if (client1) {
        client1.disconnect();
      }
      if (client2) {
        client2.disconnect();
      }
      // Give time for cleanup
      setTimeout(done, 100);
    });

    describe('join-room event', () => {
      it('should allow client to join a room', (done) => {
        client1.emit('join-room', testRoomId);

        client1.on('code-update', (data) => {
          expect(data).toHaveProperty('code');
          expect(data).toHaveProperty('language');
          expect(rooms.has(testRoomId)).toBe(true);
          expect(rooms.get(testRoomId).userCount).toBe(1);
          done();
        });
      });

      it('should notify other users when a user joins', (done) => {
        let userJoinedCount = 0;

        client1.emit('join-room', testRoomId);

        client1.on('user-joined', (data) => {
          userJoinedCount++;
          expect(data).toHaveProperty('userCount');
          if (userJoinedCount === 1) {
            // First user joined
            expect(data.userCount).toBe(1);
            // Now second user joins
            client2.emit('join-room', testRoomId);
          } else if (userJoinedCount === 2) {
            // Second user joined, both clients should be notified
            expect(data.userCount).toBe(2);
            done();
          }
        });

        client2.on('user-joined', (data) => {
          expect(data.userCount).toBe(2);
        });
      });

      it('should send current room state to new user', (done) => {
        // Set initial room state
        rooms.set(testRoomId, {
          roomId: testRoomId,
          createdAt: new Date().toISOString(),
          userCount: 0,
          code: 'const x = 42;',
          language: 'javascript',
        });

        client1.emit('join-room', testRoomId);

        client1.on('code-update', (data) => {
          expect(data.code).toBe('const x = 42;');
          expect(data.language).toBe('javascript');
          done();
        });
      });

      it('should handle invalid room ID', (done) => {
        client1.emit('join-room', null);

        client1.on('error', (error) => {
          expect(error).toHaveProperty('message', 'Room ID is required');
          done();
        });
      });
    });

    describe('code-update event', () => {
      it('should broadcast code updates to other users in the room', (done) => {
        let updatesReceived = 0;

        // Both clients join the room
        client1.emit('join-room', testRoomId);
        client2.emit('join-room', testRoomId);

        // Wait for both to join
        setTimeout(() => {
          // Client2 listens for code updates
          client2.on('code-update', (data) => {
            updatesReceived++;
            expect(data).toHaveProperty('code');
            expect(data).toHaveProperty('language');
            if (updatesReceived === 1) {
              // First update from client1
              expect(data.code).toBe('const test = 123;');
              done();
            }
          });

          // Client1 sends code update
          client1.emit('code-update', {
            roomId: testRoomId,
            code: 'const test = 123;',
            language: 'javascript',
          });
        }, 500);
      });

      it('should update room state when code is changed', (done) => {
        client1.emit('join-room', testRoomId);

        client1.on('code-update', () => {
          // After joining, send a code update
          client1.emit('code-update', {
            roomId: testRoomId,
            code: 'function hello() { return "world"; }',
            language: 'javascript',
          });

          // Check room state was updated
          setTimeout(() => {
            const room = rooms.get(testRoomId);
            expect(room.code).toBe('function hello() { return "world"; }');
            done();
          }, 100);
        });
      });

      it('should update language when language is changed', (done) => {
        client1.emit('join-room', testRoomId);

        client1.on('code-update', () => {
          client1.emit('code-update', {
            roomId: testRoomId,
            code: 'print("hello")',
            language: 'python',
          });

          setTimeout(() => {
            const room = rooms.get(testRoomId);
            expect(room.language).toBe('python');
            done();
          }, 100);
        });
      });

      it('should not broadcast to sender', (done) => {
        let updatesReceived = 0;

        client1.emit('join-room', testRoomId);

        client1.on('code-update', (data) => {
          updatesReceived++;
          // Should only receive initial state, not own updates
          if (updatesReceived === 1) {
            // Initial state received
            setTimeout(() => {
              client1.emit('code-update', {
                roomId: testRoomId,
                code: 'const x = 1;',
                language: 'javascript',
              });

              // Wait a bit and check we didn't receive our own update
              setTimeout(() => {
                expect(updatesReceived).toBe(1);
                done();
              }, 200);
            }, 100);
          }
        });
      });
    });

    describe('disconnect event', () => {
      it('should notify other users when a user leaves', (done) => {
        client1.emit('join-room', testRoomId);
        client2.emit('join-room', testRoomId);

        setTimeout(() => {
          // Client2 should be notified when client1 disconnects
          client2.on('user-left', (data) => {
            expect(data).toHaveProperty('userCount');
            expect(data.userCount).toBe(1);
            done();
          });

          // Disconnect client1
          client1.disconnect();
        }, 500);
      });

      it('should decrement user count when user disconnects', (done) => {
        client1.emit('join-room', testRoomId);
        client2.emit('join-room', testRoomId);

        setTimeout(() => {
          expect(rooms.get(testRoomId).userCount).toBe(2);
          
          client1.disconnect();

          setTimeout(() => {
            expect(rooms.get(testRoomId).userCount).toBe(1);
            done();
          }, 200);
        }, 500);
      });
    });
  });

  describe('End-to-End Integration Flow', () => {
    it('should handle complete interview session flow', (done) => {
      const roomId = 'e2e-test-room';
      let flowStep = 0;

      // Step 1: Create room via REST API
      request(app)
        .post('/api/rooms')
        .send({ roomId })
        .expect(201)
        .then((res) => {
          expect(res.body.roomId).toBe(roomId);
          flowStep = 1;

          // Step 2: Get room info
          return request(app)
            .get(`/api/rooms/${roomId}`)
            .expect(200);
        })
        .then((res) => {
          expect(res.body.roomId).toBe(roomId);
          flowStep = 2;

          // Step 3: Client1 joins via WebSocket
          const client1 = ioClient(BASE_URL, {
            transports: ['websocket'],
            forceNew: true,
          });

          return new Promise((resolve, reject) => {
            let client1InitialUpdateReceived = false;
            let client2InitialUpdateReceived = false;

            client1.on('connect', () => {
              client1.emit('join-room', roomId);
              flowStep = 3;

              // Listen for initial code update (room state)
              client1.once('code-update', (initialData) => {
                client1InitialUpdateReceived = true;
                
                // Step 4: Client1 sends code update
                client1.emit('code-update', {
                  roomId,
                  code: 'function solve() { return 42; }',
                  language: 'javascript',
                });

                flowStep = 4;

                // Step 5: Verify room state was updated
                setTimeout(() => {
                  const room = rooms.get(roomId);
                  expect(room.code).toBe('function solve() { return 42; }');
                  expect(room.language).toBe('javascript');
                  flowStep = 5;

                  // Step 6: Client2 joins
                  const client2 = ioClient(BASE_URL, {
                    transports: ['websocket'],
                    forceNew: true,
                  });

                  client2.on('connect', () => {
                    client2.emit('join-room', roomId);

                    // Client2 listens for initial state
                    client2.once('code-update', (data) => {
                      client2InitialUpdateReceived = true;
                      // Client2 should receive current code
                      expect(data.code).toBe('function solve() { return 42; }');
                      flowStep = 6;

                      // Step 7: Client2 updates code
                      client2.emit('code-update', {
                        roomId,
                        code: 'function solve() { return 100; }',
                        language: 'javascript',
                      });

                      // Step 8: Client1 should receive update from client2
                      // Use once to avoid conflicts with previous listeners
                      client1.once('code-update', (data) => {
                        if (data.code === 'function solve() { return 100; }') {
                          flowStep = 7;
                          expect(flowStep).toBe(7);
                          
                          // Cleanup
                          client1.disconnect();
                          client2.disconnect();
                          resolve();
                        }
                      });
                    });
                  });
                }, 200);
              });
            });
          });
        })
        .then(() => {
          expect(flowStep).toBe(7);
          done();
        })
        .catch((err) => {
          done(err);
        });
    }, 15000);
  });
});

